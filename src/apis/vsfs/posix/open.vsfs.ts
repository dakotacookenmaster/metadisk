import { InodeOverflowError } from "../../api-errors/InodeOverflow.error"
import { InvalidPathError } from "../../api-errors/InvalidPath.error"
import { OpenFlagError } from "../../api-errors/OpenFlag.error"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"
import getInodeLocation from "../system/GetInodeLocation.vsfs"
import isValidPath from "../system/IsValidPath.vsfs"
import { readBlock } from "../system/ReadBlock.vsfs"
import { DirectoryOverflowError } from "../../api-errors/DirectoryOverflow.error"
import { DataBlockOverflowError } from "../../api-errors/DataBlockOverflow.error"
import { writeBlock } from "../system/WriteBlock.vsfs"
import buildInode from "../system/BuildInode.vsfs"
import updateBitmap from "../system/UpdateBitmap.vsfs"
import {
    addFileDescriptor,
    selectFileDescriptorTable,
    selectSuperblock,
} from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import buildDirectory from "../system/BuildDirectory.vsfs"
import FileDescriptor from "../../interfaces/vsfs/FileDescriptor.interface"
import hasAccess from "../system/HasAccess.vsfs"
import { AccessDeniedError } from "../../api-errors/AccessDenied.error"
import { ModeError } from "../../api-errors/Mode.error"

/**
 * A POSIX-like function to open a file (and potentially create it)
 * @param pathname The path at which to open (or create) the file
 * @param flags The options for opening this file
 * @param mode The file's permission mode, only used with creating a file
 * @returns A file descriptor
 * @throws OpenFlagError
 */
export default async function open(
    pathname: string,
    flags: OpenFlags[],
    mode?: Permissions,
): Promise<number> {
    /* 
        In order to open a file, a series of checks have to be made.

        1. If O_CREAT is specified:
            + Is the path valid?
                - If you remove the last item from the path (so the parent directory), is that valid?
                - Does full path already exist? If it does, you can't create a file there
            + Is there another available space in the inode bitmap (with the maximum inode limit accounted for)?
            + Is there space available in the parent directory for another entry?
                - This means checking through all existing block pointers for an empty space, and allocating a new block if needed
        2. If O_CREAT isn't specified:
            + Is the full path valid?
    */
    const { numberOfInodeBlocks, inodeStartIndex } = selectSuperblock(
        store.getState(),
    )

    if (
        !flags.includes(OpenFlags.O_RDONLY) &&
        !flags.includes(OpenFlags.O_RDWR) &&
        !flags.includes(OpenFlags.O_WRONLY)
    ) {
        throw new OpenFlagError()
    } else if (
        (flags.includes(OpenFlags.O_RDONLY) &&
            flags.includes(OpenFlags.O_WRONLY)) ||
        (flags.includes(OpenFlags.O_RDONLY) &&
            flags.includes(OpenFlags.O_RDWR)) ||
        (flags.includes(OpenFlags.O_RDWR) &&
            flags.includes(OpenFlags.O_WRONLY)) ||
        (flags.includes(OpenFlags.O_RDONLY) &&
            flags.includes(OpenFlags.O_RDWR) &&
            flags.includes(OpenFlags.O_WRONLY))
    ) {
        throw new OpenFlagError()
    }
    if (flags.includes(OpenFlags.O_CREAT)) {
        /* The file needs to be created if it doesn't exist. */
        if (mode === undefined) {
            throw new ModeError()
        }

        // Does the file already exist?
        try {
            const inode = await isValidPath(pathname)
            // read the inode to get its permissions
            const { inodeBlock, inodeOffset } = getInodeLocation(inode)
            const permissions = (await readBlock(inodeBlock)).data.inodes[
                inodeOffset
            ].permissions
            const access = hasAccess(flags, permissions)
            if (!access) {
                throw new AccessDeniedError()
            }
            const fileDescriptor = {
                inode,
                mode: flags.find((flag) =>
                    [
                        OpenFlags.O_RDONLY,
                        OpenFlags.O_WRONLY,
                        OpenFlags.O_RDWR,
                    ].includes(flag),
                )! as
                    | OpenFlags.O_RDONLY
                    | OpenFlags.O_WRONLY
                    | OpenFlags.O_RDWR,
            } satisfies FileDescriptor

            const nextFileDescriptor = selectFileDescriptorTable(
                store.getState(),
            ).length
            store.dispatch(addFileDescriptor(fileDescriptor))
            return nextFileDescriptor
        } catch (error) {
            if (!(error instanceof InvalidPathError)) {
                // If the error is an invalid path, that's fine because we're trying to create the file anyways
                // Otherwise, we'll throw the error again
                throw error
            }
        }

        let parentDirectoryInodeNumber: number
        // Is the parent directory valid?
        try {
            parentDirectoryInodeNumber = await isValidPath(pathname, true)
        } catch (error) {
            // If it's an invalid path for the parent, we can't create this directory
            throw error
        }

        const filename = pathname
            .split("/")
            .filter((v) => v)
            .slice(-1)[0]

        // Verify that there's enough space in the inode bitmap for another inode for this file
        const { inodeCount, dataBlocks } = (await readBlock(0)).data.superblock // block 0 is the superblock
        const inodeBitmap = (await readBlock(1)).data.raw // block 1 is the inode bitmap

        let availableInode
        // Find the next available inode spot
        for (let i = 0; i < inodeBitmap.length; i++) {
            if (inodeBitmap[i] === "0" && i < inodeCount) {
                // There was an available inode!
                availableInode = i
                break
            }
        }
        if (availableInode === undefined) {
            throw new InodeOverflowError()
        }

        // Verify that there's enough space in the directory for another entry
        const { inodeBlock, inodeOffset } = getInodeLocation(
            parentDirectoryInodeNumber,
        )

        const parentDirectoryInode = (await readBlock(inodeBlock)).data.inodes[
            inodeOffset
        ]

        console.log(parentDirectoryInode)

        const { blockPointers: parentDirectoryBlockPointers } =
            parentDirectoryInode

        // Loop over each of the block pointers to get the directory entries
        let availableDirectoryBlock
        let availableDirectoryIndex
        let allocatedNewDirectoryBlock = false
        let parentDirectoryBlockPointerIndex
        for (let i = 0; i < parentDirectoryBlockPointers.length; i++) {
            if (parentDirectoryBlockPointers[i] !== 0) {
                // don't try to read from a null pointer
                parentDirectoryBlockPointerIndex = i
                const { entries } = (
                    await readBlock(parentDirectoryBlockPointers[i])
                ).data.directory

                for (let j = 0; j < entries.length; j++) {
                    if (entries[j].free) {
                        availableDirectoryBlock = parentDirectoryBlockPointers[i]
                        availableDirectoryIndex = j
                        break
                    }
                }
                if (availableDirectoryBlock && availableDirectoryIndex) {
                    break
                }
            }
        }
        if (!availableDirectoryBlock || !availableDirectoryIndex) {
            // See if there are null pointers. If there are, try to allocate a new block
            for (let i = 0; i < parentDirectoryBlockPointers.length; i++) {
                if (parentDirectoryBlockPointers[i] === 0) {
                    // This is an available block pointer spot!
                    parentDirectoryBlockPointerIndex = i
                    break
                }
            }

            if (parentDirectoryBlockPointerIndex === undefined) {
                throw new DirectoryOverflowError()
            }

            // we need to allocate another block
            const dataBitmap = (await readBlock(2)).data.raw
            for (let i = 0; i < dataBitmap.length; i++) {
                if (dataBitmap[i] === "0" && i < dataBlocks) {
                    availableDirectoryBlock =
                        i + inodeStartIndex + numberOfInodeBlocks
                    availableDirectoryIndex = 0 // it's a new block, so write to the first directory entry
                    allocatedNewDirectoryBlock = true
                    break
                }
            }

            if (
                availableDirectoryBlock === undefined ||
                availableDirectoryIndex === undefined
            ) {
                throw new DataBlockOverflowError()
            }
        }
        if (parentDirectoryBlockPointerIndex === undefined) {
            throw new DirectoryOverflowError()
        }

        // If we've made it this far, we can write the new file to the appropriate space!
        /* 
        
            STEPS:
                1. Update the parent directory to include a listing to the new file at the reserved inode
                2. Update the parent directory's inode to the new size (a new entry) and a last accessed
                3. Create the new inode entry
                4. If a new directory block was allocated, update the data bitmap
                5. Update the inode bitmap for the new file
        */

        // This is the parent directory's data block
        const availableDirectoryBlockData = (
            await readBlock(availableDirectoryBlock)
        ).data.raw

        // Using the available directory index, we can update this block, knowing that a directory entry is 128 bits
        const previousEntries = availableDirectoryBlockData.slice(
            0,
            availableDirectoryIndex * 128,
        )

        const newEntry = buildDirectory({
            entries: [
                {
                    name: filename,
                    inode: availableInode,
                },
            ],
        })

        const furtherEntries = availableDirectoryBlockData.slice(
            availableDirectoryIndex * 128 + 128,
        )
        const result = previousEntries + newEntry + furtherEntries

        await writeBlock(availableDirectoryBlock, result)

        // Update the parent directory's inode to a new size (new entry) and new last accessed time
        const newParentDirectoryBlockPointers = parentDirectoryBlockPointers
        if (allocatedNewDirectoryBlock) {
            newParentDirectoryBlockPointers[parentDirectoryBlockPointerIndex] =
                availableDirectoryBlock
        }

        const updatedParentDirectoryInode = buildInode({
            type: "directory",
            size: parentDirectoryInode.size + 128, // new directory entry
            createdAt: parentDirectoryInode.createdAt,
            lastModified: new Date(),
            blockPointers: newParentDirectoryBlockPointers,
            permissions: parentDirectoryInode.permissions,
        })

        const {
            inodeBlock: oldParentDirectoryInodeBlockNumber,
            inodeOffset: oldParentDirectoryInodeOffset,
        } = getInodeLocation(parentDirectoryInodeNumber)
        const oldParentDirectoryInodeBlock = (
            await readBlock(oldParentDirectoryInodeBlockNumber)
        ).data.raw
        const priorParentDirectoryInodes = oldParentDirectoryInodeBlock.slice(
            0,
            128 * oldParentDirectoryInodeOffset,
        )

        const restParentDirectoryInodes = oldParentDirectoryInodeBlock.slice(
            128 * oldParentDirectoryInodeOffset + 128,
        )
        const completeNewParent =
            priorParentDirectoryInodes +
            updatedParentDirectoryInode +
            restParentDirectoryInodes

        await writeBlock(inodeBlock, completeNewParent)

        // Create a new inode entry
        const date = new Date()
        const newInodeData = buildInode({
            type: "file",
            size: 0,
            createdAt: date,
            lastModified: date,
            blockPointers: [0, 0, 0, 0, 0, 0, 0, 0],
            permissions: mode,
        })

        const {
            inodeBlock: availableInodeBlock,
            inodeOffset: availableInodeBlockOffset,
        } = getInodeLocation(availableInode)

        const oldInodeBlock = (await readBlock(availableInodeBlock)).data.raw

        const priorInodes = oldInodeBlock.slice(
            0,
            128 * availableInodeBlockOffset,
        )

        const restInodes = oldInodeBlock.slice(
            128 * availableInodeBlockOffset + 128,
        )
        const completeNewInode = priorInodes + newInodeData + restInodes

        await writeBlock(availableInodeBlock, completeNewInode)

        // If a new directory block was allocated, update the data bitmap
        if (allocatedNewDirectoryBlock) {
            await updateBitmap(
                "data",
                availableDirectoryBlock - inodeStartIndex - numberOfInodeBlocks,
                "1",
            )
        }

        // Update the inode bitmap for the new file
        await updateBitmap("inode", availableInode, "1")

        // Yay! The file should have been written.
        // Add a file descriptor
        const fileDescriptor = {
            inode: availableInode,
            mode: OpenFlags.O_RDWR // while the file was created with special permissions, those only apply to other file descriptors
        } satisfies FileDescriptor
        const nextFileDescriptor = selectFileDescriptorTable(
            store.getState(),
        ).length
        store.dispatch(addFileDescriptor(fileDescriptor))
        return nextFileDescriptor
    } else {
        // Does the file already exist?
        try {
            const inode = await isValidPath(pathname)
            // read the inode to get its permissions
            const { inodeBlock, inodeOffset } = getInodeLocation(inode)
            const permissions = (await readBlock(inodeBlock)).data.inodes[
                inodeOffset
            ].permissions

            const access = hasAccess(flags, permissions)

            if (!access) {
                throw new AccessDeniedError()
            }
            const fileDescriptor = {
                inode,
                mode: flags.find((flag) =>
                    [
                        OpenFlags.O_RDONLY,
                        OpenFlags.O_WRONLY,
                        OpenFlags.O_RDWR,
                    ].includes(flag),
                )! as
                    | OpenFlags.O_RDONLY
                    | OpenFlags.O_WRONLY
                    | OpenFlags.O_RDWR,
            } satisfies FileDescriptor

            const nextFileDescriptor = selectFileDescriptorTable(
                store.getState(),
            ).length
            store.dispatch(addFileDescriptor(fileDescriptor))
            return nextFileDescriptor
        } catch (error) {
            throw error
        }
    }
}

import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { DataBlockOverflowError } from "../../api-errors/DataBlockOverflow.error"
import { DirectoryOverflowError } from "../../api-errors/DirectoryOverflow.error"
import { InodeOverflowError } from "../../api-errors/InodeOverflow.error"
import { InvalidPathError } from "../../api-errors/InvalidPath.error"
import { NameAlreadyExistsError } from "../../api-errors/NameAlreadyExists.error"
import Permissions from "../../enums/vsfs/Permissions.enum"
import buildDirectory from "../system/BuildDirectory.vsfs"
import buildInode from "../system/BuildInode.vsfs"
import getInodeLocation from "../system/GetInodeLocation.vsfs"
import isValidPath from "../system/IsValidPath.vsfs"
import { readBlock } from "../system/ReadBlock.vsfs"
import updateBitmap from "../system/UpdateBitmap.vsfs"
import { writeBlock } from "../system/WriteBlock.vsfs"

/**
 * A POSIX-like function to create a directory at the given pathname
 * @param pathname The name of the path at which you want to create the directory
 */
export default async function mkdir(pathname: string) {
    /* 
        In order to create a directory, a series of checks have to be made:
        + Is the path valid?
            - If you remove the last item from the path (so the parent directory), is that valid?
            - Does full path already exist? If it does, you can't create a file there
        + Is there another available space in the inode bitmap (with the maximum inode limit accounted for)?
        + Is there available space in the data bitmap (with the maximum block size accounted for?)
            - If so, create two new entries for the empty directory
        + Is there space available in the parent directory for another entry?
            - This means checking through all existing block pointers for an empty space, and allocating a new block if needed
    */
    const { numberOfInodeBlocks, inodeStartIndex } = selectSuperblock(
        store.getState(),
    )

    let parentDirectoryInodeNumber: number
    // Is the parent directory valid?
    try {
        parentDirectoryInodeNumber = await isValidPath(pathname, true)
    } catch (error) {
        // If it's an invalid path for the parent, we can't create this directory
        throw error
    }

    // Does the directory already exist?
    try {
        await isValidPath(pathname)
        throw new NameAlreadyExistsError()
    } catch (error) {
        if (!(error instanceof InvalidPathError)) {
            // If the error is an invalid path, that's fine because we're trying to create the directory anyways
            // Otherwise, we'll throw the error again
            throw error
        }
    }

    const filename = pathname
        .split("/")
        .filter((v) => v)
        .slice(-1)[0]

    // Verify that there's enough space in the inode bitmap for another inode for this directory
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
    const { blockPointers: parentDirectoryBlockPointers } = parentDirectoryInode

    // Loop over each of the block pointers to get the directory entries
    let availableDirectoryBlock
    let availableDirectoryIndex
    let availableDataBlock
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

    // determine if there's enough space in the data bitmap for a new directory block
    const dataBitmap = (await readBlock(2)).data.raw
    for (let i = 0; i < dataBitmap.length; i++) {
        if (
            dataBitmap[i] === "0" &&
            i < dataBlocks &&
            i + inodeStartIndex + numberOfInodeBlocks !==
                availableDirectoryBlock
        ) {
            availableDataBlock = i + inodeStartIndex + numberOfInodeBlocks
            break
        }
    }
    if (availableDataBlock === undefined) {
        throw new DataBlockOverflowError()
    }

    // If we've made it this far, we can write the new directory to the appropriate space!
    /* 
        
            STEPS:
                1. Update the parent directory to include a listing to the new directory at the reserved inode
                2. Update the parent directory's inode to the new size (a new entry) and a last accessed
                2. Create the new inode entry
                3. If a new directory block was allocated, update the data bitmap
                4. Create the new directory entries in the allocated block
                4. Update the inode bitmap for the new directory
                5. Update the data bitmap for the new directory
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
        type: "directory",
        size: 256,
        createdAt: date,
        lastModified: date,
        blockPointers: [availableDataBlock, 0, 0, 0, 0, 0, 0, 0],
        permissions: Permissions.READ_WRITE,
    })

    const {
        inodeBlock: availableInodeBlock,
        inodeOffset: availableInodeBlockOffset,
    } = getInodeLocation(availableInode)

    const oldInodeBlock = (await readBlock(availableInodeBlock)).data.raw

    const priorInodes = oldInodeBlock.slice(0, 128 * availableInodeBlockOffset)

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

    // Create the new directory entries
    const directoryEntries = buildDirectory({
        entries: [
            {
                name: ".",
                inode: availableInode
            },
            {
                name: "..",
                inode: parentDirectoryInodeNumber,
            }
        ]
    })

    // Write the directory entries to the new block
    await writeBlock(availableDataBlock, directoryEntries)

    // Update the data bitmap
    await updateBitmap("data", availableDataBlock - inodeStartIndex - numberOfInodeBlocks, "1")

    // Update the inode bitmap for the new directory
    await updateBitmap("inode", availableInode, "1")

    // Yay! The directory should have been written.
}

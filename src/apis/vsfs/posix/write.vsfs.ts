import { chunk } from "lodash"
import {
    selectBlockSize,
    selectFileDescriptorTable,
    selectSuperblock,
} from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { AccessDeniedError } from "../../api-errors/AccessDenied.error"
import { FileOverflowError } from "../../api-errors/FileOverflow.error"
import { InvalidBinaryStringError } from "../../api-errors/InvalidBinaryString.error"
import { InvalidFileDescriptorError } from "../../api-errors/InvalidFileDescriptor.error"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import getInodeLocation from "../system/GetInodeLocation.vsfs"
import { readBlock } from "../system/ReadBlock.vsfs"
import { writeBlock } from "../system/WriteBlock.vsfs"
import { writeBlocks } from "../system/WriteBlocks.vsfs"
import buildInode from "../system/BuildInode.vsfs"
import updateBitmap from "../system/UpdateBitmap.vsfs"

/**
 * A POSIX-like function that allows writing data to a file, given a file descriptor
 * @param fileDescriptor The file descriptor pointing to the file you want to write to
 * @param data The binary-encoded data you wish to write to this file
 */
export default async function write(fileDescriptor: number, data: string) {
    const state = store.getState()
    const fileDescriptorTable = selectFileDescriptorTable(state)
    if (fileDescriptor < 0 || fileDescriptor > fileDescriptorTable.length - 1) {
        throw new InvalidFileDescriptorError()
    }

    for (const char of data) {
        if (char !== "0" && char !== "1") {
            // this is invalid binary data
            throw new InvalidBinaryStringError()
        }
    }

    /* c8 ignore start */
    if (fileDescriptor === 0) {
        // this is stdin
    } else if (fileDescriptor === 1) {
        // this is stdout
    } else if (fileDescriptor === 2) {
        // this is stderr
    }
    /* c8 ignore stop */

    const descriptor = fileDescriptorTable[fileDescriptor]!

    if ([OpenFlags.O_RDWR, OpenFlags.O_WRONLY].includes(descriptor.mode)) {
        // We are allowed to write to this file
        // Begin by grabbing the inode
        const { inodeBlock, inodeOffset } = getInodeLocation(descriptor.inode)

        // Grab the inode
        const inode = (await readBlock(inodeBlock)).data.inodes[inodeOffset]

        // get the size of the binary string data
        const fileSize = data.length

        // if the size is larger than a file could ever be, throw an error
        const blockSize = selectBlockSize(state)
        const { inodeStartIndex, numberOfInodeBlocks, numberOfDataBlocks } =
            selectSuperblock(state)
        const maxFileSize = blockSize * 8 // all files can have up to 8 block pointers

        if (fileSize > maxFileSize) {
            throw new FileOverflowError()
        }

        // It's not immediately too large, though we could run into allocation issues later
        // Begin by splitting the data into chunks and determining how many blocks we'll need
        const segments = chunk(data, blockSize).map((segment) =>
            segment.join(""),
        )

        // Find out how many blocks we'll need
        const necessaryBlocks = segments.length

        // get the read file block pointers (remove null)
        const pointers = inode.blockPointers.filter((v) => v)

        // Determine how many blocks the inode already has allocated (remove null pointers)
        const availableBlocks = inode.blockPointers.filter((v) => v).length

        if (necessaryBlocks === availableBlocks) {
            // we're in luck! We have the exact amount of allocated blocks, and we can just write
            for (let i = 0; i < pointers.length; i++) {
                await writeBlocks(pointers, segments)
            }

            // Now that we've written, we need to update the inode to show its new size
            // as well as its last modified date
            const updatedInode = buildInode({
                ...inode,
                size: fileSize,
                lastModified: new Date(),
            })

            // read the old inode block to rebuild it
            const oldInodeBlock = (await readBlock(inodeBlock)).data.raw
            const previousInodes = oldInodeBlock.slice(0, inodeOffset * 128)
            const furtherInodes = oldInodeBlock.slice(inodeOffset * 128 + 128)

            const newInodeBlock = previousInodes + updatedInode + furtherInodes

            // write the updated inode
            await writeBlock(inodeBlock, newInodeBlock)
        } else if (necessaryBlocks < availableBlocks) {
            // The file was reduced in size. This means we can deallocate some blocks

            // Let's go ahead and grab the first few that were allocated that we need
            const neededPointers = pointers.slice(0, necessaryBlocks)

            // Find the pointers to discard
            const discardPointers = pointers.slice(necessaryBlocks)

            // Craft null pointers in place of the ones to discard
            const nullPointers = discardPointers.map(() => 0)

            while(nullPointers.length + neededPointers.length < 8) {
                nullPointers.push(0)
            }

            // Write the data to the available pointers
            await writeBlocks(neededPointers, segments)

            // Update the inode with the new size, last modified, and new pointers
            const updatedInode = buildInode({
                ...inode,
                size: fileSize,
                lastModified: new Date(),
                blockPointers: [...neededPointers, ...nullPointers],
            })

            // read the old inode block to rebuild it
            const oldInodeBlock = (await readBlock(inodeBlock)).data.raw
            const previousInodes = oldInodeBlock.slice(0, inodeOffset * 128)
            const furtherInodes = oldInodeBlock.slice(inodeOffset * 128 + 128)

            const newInodeBlock = previousInodes + updatedInode + furtherInodes

            // Write the updated inode
            await writeBlock(inodeBlock, newInodeBlock)

            // Update the bitmap for each of the now deallocated pointers
            for (const pointer of discardPointers) {
                await updateBitmap(
                    "data",
                    pointer - inodeStartIndex - numberOfInodeBlocks,
                    "0",
                )
            }
        } else {
            // the file has grown in size. We need to allocate new blocks
            const difference = necessaryBlocks - availableBlocks

            // We need to allocate new blocks equal to difference, let's see if we can
            const newBlocks: number[] = []

            // Find the next available block
            const dataBitmap = (await readBlock(2)).data.raw

            for (
                let i = 0;
                i < dataBitmap.length && i < numberOfDataBlocks;
                i++
            ) {
                if (dataBitmap[i] === "0") {
                    // this is a free space, add it to our new blocks
                    newBlocks.push(i + inodeStartIndex + numberOfInodeBlocks)
                    if (newBlocks.length === difference) {
                        break
                    }
                }
            }

            /* c8 ignore start */
            if (newBlocks.length !== difference) {
                throw new FileOverflowError()
            }
            /* c8 ignore stop */

            // We found the new blocks we need to write to, in addition to any that
            // are existing. Start by writing the file
            await writeBlocks([...pointers, ...newBlocks], segments)

            // build the new block pointers, with nulls padding the end
            const newBlockPointers = [...pointers, ...newBlocks]

            while (newBlockPointers.length < 8) {
                newBlockPointers.push(0)
            }

            // Now, update the inode to show the new size, last modified, and updated pointers
            const updatedInode = buildInode({
                ...inode,
                size: fileSize,
                lastModified: new Date(),
                blockPointers: newBlockPointers,
            })

            // read the old inode block to rebuild it
            const oldInodeBlock = (await readBlock(inodeBlock)).data.raw
            const previousInodes = oldInodeBlock.slice(0, inodeOffset * 128)
            const furtherInodes = oldInodeBlock.slice(inodeOffset * 128 + 128)

            const newInodeBlock = previousInodes + updatedInode + furtherInodes

            // Write the updated inode
            await writeBlock(inodeBlock, newInodeBlock)

            // For each of the new pointers, update the data bitmap
            for (const pointer of newBlocks) {
                await updateBitmap(
                    "data",
                    pointer - inodeStartIndex - numberOfInodeBlocks,
                    "1",
                )
            }

            // The write should have been successful!
        }
    } else {
        throw new AccessDeniedError()
    }
}

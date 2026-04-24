import {
    selectBlockSize,
    selectFileDescriptorTable,
    selectSuperblock,
} from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { AccessDeniedError } from "../../api-errors/AccessDenied.error"
import { FileOverflowError } from "../../api-errors/FileOverflow.error"
import { InvalidFileDescriptorError } from "../../api-errors/InvalidFileDescriptor.error"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import getInodeLocation from "../system/GetInodeLocation.vsfs"
import { readBlock, writeBlock } from "../system/BlockCache.vsfs"
import { writeBlocks } from "../system/WriteBlocks.vsfs"
import buildInode from "../system/BuildInode.vsfs"
import updateBitmap from "../system/UpdateBitmap.vsfs"
import { sliceBits, concatBuffers } from "../../utils/BitBuffer.utils"

/**
 * A POSIX-like function that allows writing data to a file, given a file descriptor
 * @param fileDescriptor The file descriptor pointing to the file you want to write to
 * @param data The data you wish to write to this file (as Uint8Array)
 * @param appId Optional originating app id, forwarded down to every disk
 *              read/write so the disk simulator can attribute each queued
 *              sector to the calling app. Apps don't pass this themselves;
 *              it is injected by the `usePosix()` hook.
 */
export default async function write(fileDescriptor: number, data: Uint8Array, appId?: string) {
    const state = store.getState()
    const fileDescriptorTable = selectFileDescriptorTable(state)
    if (fileDescriptor < 0 || fileDescriptor > fileDescriptorTable.length - 1) {
        throw new InvalidFileDescriptorError()
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
        const inode = (await readBlock(inodeBlock, undefined, appId)).data.inodes[inodeOffset]

        // get the size of the data in bits
        const fileSize = data.length * 8

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
        const segments: Uint8Array[] = []
        const blockBytes = blockSize / 8
        for (let i = 0; i < data.length; i += blockBytes) {
            const segment = data.slice(i, Math.min(i + blockBytes, data.length))
            segments.push(segment)
        }

        // Find out how many blocks we'll need
        const necessaryBlocks = segments.length

        // get the read file block pointers (remove null)
        const pointers = inode.blockPointers.filter((v) => v)

        // Determine how many blocks the inode already has allocated (remove null pointers)
        const availableBlocks = inode.blockPointers.filter((v) => v).length

        if (necessaryBlocks === availableBlocks) {
            // we're in luck! We have the exact amount of allocated blocks, and we can just write
            for (let i = 0; i < pointers.length; i++) {
                await writeBlocks(pointers, segments, undefined, appId)
            }

            // Now that we've written, we need to update the inode to show its new size
            // as well as its last modified date
            const updatedInode = buildInode({
                ...inode,
                size: fileSize,
                lastModified: new Date(),
            })

            // read the old inode block to rebuild it
            const oldInodeBlock = (await readBlock(inodeBlock, undefined, appId)).data.raw
            const previousInodes = sliceBits(oldInodeBlock, 0, inodeOffset * 128)
            const furtherInodes = sliceBits(oldInodeBlock, inodeOffset * 128 + 128, oldInodeBlock.length * 8 - (inodeOffset * 128 + 128))

            const newInodeBlock = concatBuffers([previousInodes, updatedInode, furtherInodes])

            // write the updated inode
            await writeBlock(inodeBlock, newInodeBlock, undefined, appId)
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
            await writeBlocks(neededPointers, segments, undefined, appId)

            // Update the inode with the new size, last modified, and new pointers
            const updatedInode = buildInode({
                ...inode,
                size: fileSize,
                lastModified: new Date(),
                blockPointers: [...neededPointers, ...nullPointers],
            })

            // read the old inode block to rebuild it
            const oldInodeBlock = (await readBlock(inodeBlock, undefined, appId)).data.raw
            const previousInodes = sliceBits(oldInodeBlock, 0, inodeOffset * 128)
            const furtherInodes = sliceBits(oldInodeBlock, inodeOffset * 128 + 128, oldInodeBlock.length * 8 - (inodeOffset * 128 + 128))

            const newInodeBlock = concatBuffers([previousInodes, updatedInode, furtherInodes])

            // Write the updated inode
            await writeBlock(inodeBlock, newInodeBlock, undefined, appId)

            // Update the bitmap for each of the now deallocated pointers
            for (const pointer of discardPointers) {
                await updateBitmap(
                    "data",
                    pointer - inodeStartIndex - numberOfInodeBlocks,
                    "0",
                    appId,
                )
            }
        } else {
            // the file has grown in size. We need to allocate new blocks
            const difference = necessaryBlocks - availableBlocks

            // We need to allocate new blocks equal to difference, let's see if we can
            const newBlocks: number[] = []

            // Find the next available block
            const dataBitmap = (await readBlock(2, undefined, appId)).data.raw

            // Check each bit in the bitmap
            for (
                let i = 0;
                i < dataBitmap.length * 8 && i < numberOfDataBlocks;
                i++
            ) {
                const byteIndex = Math.floor(i / 8)
                const bitIndex = 7 - (i % 8)
                const bit = (dataBitmap[byteIndex] >> bitIndex) & 1
                
                if (bit === 0) {
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
            await writeBlocks([...pointers, ...newBlocks], segments, undefined, appId)

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
            const oldInodeBlock = (await readBlock(inodeBlock, undefined, appId)).data.raw
            const previousInodes = sliceBits(oldInodeBlock, 0, inodeOffset * 128)
            const furtherInodes = sliceBits(oldInodeBlock, inodeOffset * 128 + 128, oldInodeBlock.length * 8 - (inodeOffset * 128 + 128))

            const newInodeBlock = concatBuffers([previousInodes, updatedInode, furtherInodes])

            // Write the updated inode
            await writeBlock(inodeBlock, newInodeBlock, undefined, appId)

            // For each of the new pointers, update the data bitmap
            for (const pointer of newBlocks) {
                await updateBitmap(
                    "data",
                    pointer - inodeStartIndex - numberOfInodeBlocks,
                    "1",
                    appId,
                )
            }

            // The write should have been successful!
        }
    } else {
        throw new AccessDeniedError()
    }
}

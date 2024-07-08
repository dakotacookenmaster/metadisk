import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { UnlinkDirectoryError } from "../../api-errors/UnlinkDirectory.error"
import buildDirectory from "../system/BuildDirectory.vsfs"
import buildInode from "../system/BuildInode.vsfs"
import getInodeLocation from "../system/GetInodeLocation.vsfs"
import isValidPath from "../system/IsValidPath.vsfs"
import { readBlock } from "../system/ReadBlock.vsfs"
import updateBitmap from "../system/UpdateBitmap.vsfs"
import { writeBlock } from "../system/WriteBlock.vsfs"

/**
 * A POSIX-like function to unlink (delete) a file from the file system
 * @param pathname
 */
export default async function unlink(pathname: string) {
    /* 
        Deleting a file takes a few steps:
        1. Is it a valid path?
        2. If it is a valid path, is it a file? If it's a directory, this should fail
        3. If it's a valid file, do the following:
            - Update the parent directory
                * Remove the entry
                * Update the last modified date
                * Decrease the directory size
                * If the file entry is the last entry in the block for this directory, deallocate the block and update the bitmap
            - Mark any data blocks pointed to by this file as free in the data bitmap
            - Mark this inode as free in the inode bitmap

    */
    /* Verify it's a valid path (getting both the parent inode and the child) */
    const parentInode = await isValidPath(pathname, true)
    const inode = await isValidPath(pathname)
    const { inodeStartIndex, numberOfInodeBlocks } = selectSuperblock(
        store.getState(),
    )

    const { inodeBlock, inodeOffset } = getInodeLocation(inode)
    const inodeData = (await readBlock(inodeBlock)).data

    // Verify it's a file
    if (inodeData.inodes[inodeOffset].type !== "file") {
        throw new UnlinkDirectoryError()
    }

    const pointers = inodeData.inodes[inodeOffset].blockPointers.filter(
        (v) => v,
    )

    // Update the parent directory and remove this entry, reducing its size
    const {
        inodeBlock: parentDirectoryInodeBlock,
        inodeOffset: parentDirectoryInodeOffset,
    } = getInodeLocation(parentInode)
    const parentDirectoryData = (await readBlock(parentDirectoryInodeBlock))
        .data
    const parentDirectoryInode =
        parentDirectoryData.inodes[parentDirectoryInodeOffset]
    let directoryEntries = null
    let directoryIndex = -1
    let directoryBlock = -1
    for (let pointer of parentDirectoryInode.blockPointers.filter((v) => v)) {
        const entries = (await readBlock(pointer)).data.directory.entries
        for (let i = 0; i < entries.length; i++) {
            if (
                entries[i].name ===
                pathname
                    .split("/")
                    .filter((v) => v)
                    .slice(-1)[0]
            ) {
                directoryEntries = entries
                directoryIndex = i
                directoryBlock = pointer
                break
            }
        }
        if (directoryEntries !== null) {
            break
        }
    }
    if (directoryEntries === null) {
        throw new Error(
            "An unknown error occurred while trying to delete the directory.",
        )
    }

    // Rebuild the directory from the old entries
    const previousEntries = directoryEntries.slice(0, directoryIndex)
    const furtherEntries = directoryEntries.slice(directoryIndex + 1)
    const newEntries = [...previousEntries, ...furtherEntries].filter(
        (entry) => !entry.free,
    )

    const newDirectory = buildDirectory({
        entries: newEntries,
    })

    let blockPointers = parentDirectoryInode.blockPointers
    let removedBlockPointer: number | null = null
    if (newDirectory === "") {
        for (let pointer of blockPointers) {
            if (pointer === directoryBlock) {
                removedBlockPointer = pointer
                break
            }
        }
    } else {
        // write the updated directory
        await writeBlock(directoryBlock, newDirectory)
    }

    // Update the parent directory inode with the new data and size
    const newParentDirectoryInode = buildInode({
        ...parentDirectoryInode,
        size: parentDirectoryInode.size - 128,
        lastModified: new Date(),
        blockPointers:
            removedBlockPointer !== null
                ? [...blockPointers.filter((v) => v !== removedBlockPointer), 0]
                : blockPointers,
    })

    // rebuild the inode
    const previousParentDirectoryInodes = parentDirectoryData.raw.slice(
        0,
        parentDirectoryInodeOffset * 128,
    )
    const furtherParentDirectoryInodes = parentDirectoryData.raw.slice(
        parentDirectoryInodeOffset * 128 + 128,
    )

    const updatedParentDirectoryInodes =
        previousParentDirectoryInodes +
        newParentDirectoryInode +
        furtherParentDirectoryInodes

    await writeBlock(parentDirectoryInodeBlock, updatedParentDirectoryInodes)

    // Update the inode bitmap to show this inode as being free
    await updateBitmap("inode", inode, "0")

    // if the directory got small enough in size to lose a block, deallocate it
    if (removedBlockPointer !== null) {
        await updateBitmap(
            "data",
            removedBlockPointer - inodeStartIndex - numberOfInodeBlocks,
            "0",
        )
    }

    // each of those block pointers in the deleted file needs to be deallocated from the data bitmap
    for (let pointer of pointers) {
        await updateBitmap(
            "data",
            pointer - inodeStartIndex - numberOfInodeBlocks,
            "0",
        )
    }

    // Yay! The file should have been deleted!
}

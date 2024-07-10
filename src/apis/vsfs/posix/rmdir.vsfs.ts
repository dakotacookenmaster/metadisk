import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { DirectoryNotEmptyError } from "../../api-errors/DirectoryNotEmpty.error"
import { InvalidDirectoryPath } from "../../api-errors/InvalidDirectoryPath.error"
import buildDirectory from "../system/BuildDirectory.vsfs"
import buildInode from "../system/BuildInode.vsfs"
import getInodeLocation from "../system/GetInodeLocation.vsfs"
import isValidPath from "../system/IsValidPath.vsfs"
import { readBlock } from "../system/ReadBlock.vsfs"
import updateBitmap from "../system/UpdateBitmap.vsfs"
import { writeBlock } from "../system/WriteBlock.vsfs"

/**
 * A POSIX-like function that removes an empty directory.
 * @param pathname The pathname of the empty directory to remove
 */
export default async function rmdir(pathname: string) {
    /* Verify it's a valid path */
    const inode = await isValidPath(pathname)
    const { inodeStartIndex, numberOfInodeBlocks } = selectSuperblock(
        store.getState(),
    )

    /* Read the inode and loop over its non-null block pointers. These will each be a 
    directory with entries. If the only two entries are . and .., keep going. If all of the
    directories are empty (with the exception of . and ..), you can remove this directory.
    Otherwise, throw an error. */
    const { inodeBlock, inodeOffset } = getInodeLocation(inode)
    const inodeData = (await readBlock(inodeBlock)).data

    // Verify it's a directory
    if(inodeData.inodes[inodeOffset].type !== "directory") {
        throw new InvalidDirectoryPath()
    }

    const pointers = inodeData.inodes[inodeOffset].blockPointers.filter(
        (v) => v,
    )

    // loop over the block pointers
    let parentInode = -1
    for (let pointer of pointers) {
        const entries = (
            await readBlock(pointer)
        ).data.directory.entries.filter((entry) => !entry.free)
        for (let entry of entries) {
            if (entry.name === ".." && parentInode === -1) {
                parentInode = entry.inode
            }
            if (entry.name !== "." && entry.name !== "..") {
                throw new DirectoryNotEmptyError()
            }
        }
    }
    // If we made it this far, the directory is empty

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
    /* c8 ignore start */
    if (directoryEntries === null) {
        throw new Error(
            "An unknown error occurred while trying to delete the directory.",
        )
    }
    /* c8 ignore stop */

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
        /* c8 ignore start */
        for (let pointer of blockPointers) {
            if (pointer === directoryBlock) {
                removedBlockPointer = pointer
                break
            }
        }
        /* c8 ignore stop */
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
                /* c8 ignore next */
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
    /* c8 ignore start */
    if (removedBlockPointer !== null) {
        await updateBitmap(
            "data",
            removedBlockPointer - inodeStartIndex - numberOfInodeBlocks,
            "0",
        )
    }
    /* c8 ignore stop */

    // each of those block pointers in the deleted directory needs to be deallocated from the data bitmap
    for (let pointer of pointers) {
        await updateBitmap(
            "data",
            pointer - inodeStartIndex - numberOfInodeBlocks,
            "0",
        )
    }

    // Yay! The folder should have been deleted!
}

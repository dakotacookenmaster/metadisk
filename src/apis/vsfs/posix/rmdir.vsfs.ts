import { DirectoryNotEmptyError } from "../../api-errors/DirectoryNotEmpty.error"
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

    /* Read the inode and loop over its non-null block pointers. These will each be a 
    directory with entries. If the only two entries are . and .., keep going. If all of the
    directories are empty (with the exception of . and ..), you can remove this directory.
    Otherwise, throw an error. */
    const { inodeBlock, inodeOffset } = getInodeLocation(inode)
    const inodeData = (await readBlock(inodeBlock)).data
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
    for (let pointer of parentDirectoryInode.blockPointers) {
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
    const newEntries = [...previousEntries, ...furtherEntries]

    const newDirectory = buildDirectory({
        entries: newEntries,
    })

    // write the new directory
    await writeBlock(directoryBlock, newDirectory)

    // Update the parent directory inode with the new data and size
    const newParentDirectoryInode = buildInode({
        ...parentDirectoryInode,
        size: parentDirectoryInode.size - 128,
        lastModified: new Date(),
    })

    // rebuild the inode file
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

    // Delete the directory inode
    const previousInodes = inodeData.raw.slice(0, 128 * inodeOffset) // get the previous inodes
    const furtherInodes = inodeData.raw.slice(128 * inodeOffset + 128) // get the rest of the inodes
    const emptyInode = "0".repeat(128) // fill in the inode with nulls

    const updatedInode = previousInodes + emptyInode + furtherInodes
    await writeBlock(inodeBlock, updatedInode)

    // Update the inode bitmap to show this inode as being free
    await updateBitmap("inode", inode, "0")

    // Yay! The folder should have been deleted!
}

import getInodeLocation from "../system/GetInodeLocation.vsfs";
import isValidPath from "../system/IsValidPath.vsfs";

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
    const inode = await isValidPath(pathname)
    const { inodeBlock, inodeOffset } = getInodeLocation(inode)
    console.log(inodeBlock, inodeOffset)
}
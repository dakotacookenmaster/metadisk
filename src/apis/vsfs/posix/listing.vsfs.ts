import { InvalidDirectoryPath } from "../../api-errors/InvalidDirectoryPath.error";
import DirectoryEntry from "../../interfaces/vsfs/DirectoryEntry.interface";
import DirectoryListing from "../../interfaces/vsfs/DirectoryListing.interface";
import getInodeLocation from "../system/GetInodeBlock.vsfs";
import isValidPath from "../system/IsValidPath.vsfs";
import { readBlock } from "../system/ReadBlock.vsfs";

/**
 * Returns a directory listing for a given directory path
 * @param pathname The directory's pathname
 */
export default async function listing(pathname: string): Promise<DirectoryListing> {
    const inodeNumber = await isValidPath(pathname)
    const { inodeBlock, inodeOffset } = getInodeLocation(inodeNumber)
    const inode = (await readBlock(inodeBlock)).data.inodes[inodeOffset]

    if(inode.type !== "directory") {
        throw new InvalidDirectoryPath()
    }
    const allEntries: DirectoryEntry[] = []
    for(let pointer of inode.blockPointers) {
        // each of these pointers should point to a directory
        const { entries } = (await readBlock(pointer)).data.directory
        allEntries.push(...entries)
    }

    return {
        inode: inodeNumber,
        pathname,
        entries: allEntries
    }
}

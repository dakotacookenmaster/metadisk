import { FilenameTooLongError } from "../../api-errors/FilenameTooLong.error"
import { InvalidPathError } from "../../api-errors/InvalidPath.error"
import DirectoryEntry from "../../interfaces/vsfs/DirectoryEntry.interface"
import getInodeLocation from "./GetInodeLocation.vsfs"
import { readBlock } from "./ReadBlock.vsfs"

/**
 * Checks if a given path is valid. If it is, it will return the inode corresponding to the file or directory.
 * @param pathname The pathname to check
 * @returns
 * @throws InvalidPathError
 * @throws FilenameTooLongError
 */
export default async function isValidPath(pathname: string, useParentDirectory: boolean = false): Promise<number> {
    if (pathname.length === 0 || pathname[0] !== "/") {
        throw new InvalidPathError()
    }

    let path = pathname.split("/").filter((v) => v) // get rid of empty strings
    if(useParentDirectory) {
        path = path.slice(0, -1) // remove the last item if you're just worried about the parent directory
    }
    let position = 0
    let inodeNumber = 0 // inode 0 is the root directory
    let found = false

    while (position !== path.length) {
        if(path[position].length > 13) {
            throw new FilenameTooLongError()
        }

        const { inodeBlock, inodeOffset } = getInodeLocation(inodeNumber)

        const inode = (await readBlock(inodeBlock)).data.inodes[inodeOffset]

        if(inode.type === "file" && position !== path.length - 1) {
            // a file name was provided as a piece of the path...this is an invalid path
            throw new InvalidPathError()
        } else if(inode.type === "file") {
            // We've reached the end and this is a file. We don't want to interpret this as a directory.
            // Just return the inode
            return inodeNumber
        }

        const allEntries: DirectoryEntry[] = []
        for(let pointer of inode.blockPointers) {
            const { entries} = (await readBlock(pointer)).data.directory
            allEntries.push(...entries)
        }
        found = false
        for(let entry of allEntries) {
            if(entry.name === path[position]) {
                position++
                inodeNumber = entry.inode
                found = true
                break
            }
        }
        if(!found) {
            throw new InvalidPathError()
        }
    }
    return inodeNumber
}

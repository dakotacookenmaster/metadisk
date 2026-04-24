import { InvalidDirectoryPath } from "../../api-errors/InvalidDirectoryPath.error"
import DirectoryListing from "../../interfaces/vsfs/DirectoryListing.interface"
import getInodeLocation from "../system/GetInodeLocation.vsfs"
import isValidPath from "../system/IsValidPath.vsfs"
import { readBlock } from "../system/BlockCache.vsfs"

/**
 * Returns a directory listing for a given directory path
 * @param pathname The directory's pathname
 * @param appId Optional originating app id, forwarded down so every disk
 *              read this function performs is attributed to the calling
 *              app. Apps don't pass this themselves; it is injected by the
 *              `usePosix()` hook.
 */
export default async function listing(
    pathname: string,
    appId?: string,
): Promise<DirectoryListing> {
    const inodeNumber = await isValidPath(pathname, false, appId)
    const { inodeBlock, inodeOffset } = getInodeLocation(inodeNumber)
    const inode = (await readBlock(inodeBlock, undefined, appId)).data.inodes[inodeOffset]

    if (inode.type !== "directory") {
        throw new InvalidDirectoryPath()
    }
    const allEntries = []
    for (const pointer of inode.blockPointers.filter((v) => v)) {
        // each of these pointers should point to a directory
        const { entries } = (await readBlock(pointer, undefined, appId)).data.directory
        const updatedEntries = await Promise.all(
            entries
                .filter((entry) => !entry.free)
                .filter((entry) => entry.name !== "." && entry.name !== "..")
                .map(async (entry) => {
                    const {
                        inodeBlock: entryInodeBlock,
                        inodeOffset: entryInodeOffset,
                    } = getInodeLocation(entry.inode)
                    const entryInode = (await readBlock(entryInodeBlock, undefined, appId)).data
                        .inodes[entryInodeOffset]
                    return {
                        ...entry,
                        pathname:
                            pathname === "/"
                                ? pathname + entry.name
                                : pathname + "/" + entry.name,
                        type: entryInode.type,
                    }
                }),
        )
        allEntries.push(...updatedEntries)
    }

    return {
        inode: inodeNumber,
        pathname,
        entries: allEntries,
    }
}

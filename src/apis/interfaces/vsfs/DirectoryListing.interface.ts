import DirectoryEntry from "./DirectoryEntry.interface";

export default interface DirectoryListing {
    pathname: string,
    inode: number
    entries: DirectoryEntry[]
}
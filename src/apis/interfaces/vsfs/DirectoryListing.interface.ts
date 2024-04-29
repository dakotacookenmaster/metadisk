import DirectoryEntry from "./DirectoryEntry.interface";

export default interface DirectoryListing {
    readonly pathname: string,
    readonly inode: number
    readonly entries: (DirectoryEntry & { pathname: string, type: "file" | "directory" })[]
}
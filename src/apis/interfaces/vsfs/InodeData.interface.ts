export default interface InodeData {
    inode: number
    type: "file" | "directory"
    read: boolean
    write: boolean
    execute: boolean
    size: number
    createdAt: Date
    lastAccessed: Date
    blockPointers: number[]
}
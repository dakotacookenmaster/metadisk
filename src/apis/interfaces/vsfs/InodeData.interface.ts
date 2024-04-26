import Permissions from "../../enums/vsfs/Permissions.enum"

export default interface InodeData {
    readonly inode: number
    readonly type: "file" | "directory"
    readonly permissions: Permissions
    readonly size: number
    readonly createdAt: Date
    readonly lastModified: Date
    readonly blockPointers: number[]
}
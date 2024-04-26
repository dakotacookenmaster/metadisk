import Permissions from "../../enums/vsfs/Permissions.enum"

export default interface BuildInodeData {
    type: "file" | "directory"
    permissions: Permissions
    size: number
    createdAt: Date
    lastModified: Date
    blockPointers: number[]
}
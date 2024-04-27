import { InvalidBlockPointerError } from "../../api-errors/InvalidBlockPointer.error"
import { InvalidBlockPointerCountError } from "../../api-errors/InvalidBlockPointerCount.error"
import BuildInodeData from "../../interfaces/vsfs/BuildInodeData.interface"

export default function buildInode(inode: BuildInodeData) {
    if (inode.blockPointers.length != 8) {
        throw new InvalidBlockPointerCountError()
    }

    const type = inode.type === "file" ? "00" : "01"
    const permissions = inode.permissions
    const size = inode.size.toString(2).padStart(24, "0")
    const createdAt = Math.floor(+inode.createdAt / 1000)
        .toString(2)
        .padStart(32, "0")
    const lastModified = Math.floor(+inode.lastModified / 1000)
        .toString(2)
        .padStart(32, "0")
    const blockPointers = inode.blockPointers
        .map((pointer) => {
            if(pointer > 15 || pointer < 0) {
                throw new InvalidBlockPointerError()
            }
            return pointer.toString(2).padStart(4, "0")
        })
        .join("")

    return type + permissions + size + createdAt + lastModified + blockPointers
}

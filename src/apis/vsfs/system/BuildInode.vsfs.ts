import BuildInodeData from "../../interfaces/vsfs/BuildInodeData.interface"

export default function buildInode(inode: BuildInodeData) {
    const type = inode.type === "file" ? "00" : "01"
    const permissions = inode.permissions
    const size = inode.size.toString(2).padStart(24, "0")
    const createdAt = Math.floor(+inode.createdAt / 1000).toString(2).padStart(32, "0")
    const lastModified = Math.floor(+inode.lastModified / 1000).toString(2).padStart(32, "0")
    const blockPointers = inode.blockPointers.map(pointer => pointer.toString(2).padStart(4, "0")).join('')

    return type + permissions + size + createdAt + lastModified + blockPointers
}

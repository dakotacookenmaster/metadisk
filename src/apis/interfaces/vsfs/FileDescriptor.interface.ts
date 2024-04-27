import OpenFlags from "../../enums/vsfs/OpenFlags.enum"

export default interface FileDescriptor {
    inode: number
    mode: OpenFlags.O_RDONLY | OpenFlags.O_RDWR | OpenFlags.O_WRONLY
}
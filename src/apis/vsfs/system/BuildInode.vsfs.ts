import { InvalidBlockPointerError } from "../../api-errors/InvalidBlockPointer.error"
import { InvalidBlockPointerCountError } from "../../api-errors/InvalidBlockPointerCount.error"
import BuildInodeData from "../../interfaces/vsfs/BuildInodeData.interface"

export default function buildInode(inode: BuildInodeData): Uint8Array {
    if (inode.blockPointers.length != 8) {
        throw new InvalidBlockPointerCountError()
    }

    const buffer = new Uint8Array(16) // an inode takes 16 bytes
    buffer[0] = ((inode.type === "file" ? 0 : 1) << 6) | inode.permissions // first byte is type and permissions
    buffer[1] = inode.size >> 16 // inode size (1st byte of 3 bytes)
    buffer[2] = (inode.size >> 8) & 0xFF // inode size (2nd byte of 3 bytes)
    buffer[3] = inode.size & 0xFF // inode size (3rd byte of 3 bytes)

    const createdAt = Math.floor(+inode.createdAt / 1000)
    buffer[4] = createdAt >> 24 // createdAt (1st byte of 4 bytes)
    buffer[5] = (createdAt >> 16) & 0xFF // createdAt (2nd byte of 4 bytes)
    buffer[6] = (createdAt >> 8) & 0xFF // createdAt (3rd byte of 4 bytes)
    buffer[7] = createdAt & 0xFF // createdAt (4th byte of 4 bytes)

    const lastModified = Math.floor(+inode.lastModified / 1000)
    buffer[8] = lastModified >> 24 // lastModified (1st byte of 4 bytes)
    buffer[9] = (lastModified >> 16) & 0xFF // lastModified (2nd byte of 4 bytes)
    buffer[10] = (lastModified >> 8) & 0xFF // lastModified (3rd byte of 4 bytes)
    buffer[11] = lastModified & 0xFF // lastModified (4th byte of 4 bytes)

    // collect the block pointers, the last 4 bytes (8 block pointers, each a nibble)
    const blockPointers = inode.blockPointers
        .map((pointer) => {
            if(pointer > 15 || pointer < 0) {
                throw new InvalidBlockPointerError()
            }
            return pointer
        })

    // set the block pointers in the array buffer
    buffer[12] = (blockPointers[0] << 4) | (blockPointers[1] & 0xF)
    buffer[13] = (blockPointers[2] << 4) | (blockPointers[3] & 0xF)
    buffer[14] = (blockPointers[4] << 4) | (blockPointers[5] & 0xF)
    buffer[15] = (blockPointers[6] << 4) | (blockPointers[7] & 0xF)

    return buffer
}

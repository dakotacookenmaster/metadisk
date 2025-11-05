import { InvalidBlockPointerError } from "../../api-errors/InvalidBlockPointer.error"
import { InvalidBlockPointerCountError } from "../../api-errors/InvalidBlockPointerCount.error"
import BuildInodeData from "../../interfaces/vsfs/BuildInodeData.interface"
import { writeBits, createBuffer } from "../../utils/BitBuffer.utils"

export default function buildInode(inode: BuildInodeData): Uint8Array {
    if (inode.blockPointers.length != 8) {
        throw new InvalidBlockPointerCountError()
    }

    // Total size: 2 + 6 + 24 + 32 + 32 + (8*4) = 128 bits
    const buffer = createBuffer(128)
    
    let bitOffset = 0
    
    // Type: 2 bits (00 for file, 01 for directory)
    const typeValue = inode.type === "file" ? 0b00 : 0b01
    writeBits(buffer, typeValue, bitOffset, 2)
    bitOffset += 2
    
    // Permissions: 6 bits (parse from permission string like "rwxrwx")
    const permissionsValue = parseInt(inode.permissions, 2)
    writeBits(buffer, permissionsValue, bitOffset, 6)
    bitOffset += 6
    
    // Size: 24 bits
    writeBits(buffer, inode.size, bitOffset, 24)
    bitOffset += 24
    
    // Created at: 32 bits (Unix timestamp in seconds)
    const createdAtSeconds = Math.floor(+inode.createdAt / 1000)
    writeBits(buffer, createdAtSeconds, bitOffset, 32)
    bitOffset += 32
    
    // Last modified: 32 bits (Unix timestamp in seconds)
    const lastModifiedSeconds = Math.floor(+inode.lastModified / 1000)
    writeBits(buffer, lastModifiedSeconds, bitOffset, 32)
    bitOffset += 32
    
    // Block pointers: 8 pointers of 4 bits each = 32 bits
    for (const pointer of inode.blockPointers) {
        if (pointer > 15 || pointer < 0) {
            throw new InvalidBlockPointerError()
        }
        writeBits(buffer, pointer, bitOffset, 4)
        bitOffset += 4
    }
    
    return buffer
}

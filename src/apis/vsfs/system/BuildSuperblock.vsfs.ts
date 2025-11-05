import BuildSuperBlockData from "../../interfaces/vsfs/BuildSuperblockData.interface"
import { writeBits, createBuffer } from "../../utils/BitBuffer.utils"

export default function buildSuperblock(superblock: BuildSuperBlockData): Uint8Array {
    // Total size: 8 + 16 + 4 + 4 + 24 = 56 bits
    const buffer = createBuffer(56)
    
    let bitOffset = 0
    
    // Magic number: 8 bits
    writeBits(buffer, superblock.magicNumber, bitOffset, 8)
    bitOffset += 8
    
    // Inode count: 16 bits
    writeBits(buffer, superblock.inodeCount, bitOffset, 16)
    bitOffset += 16
    
    // Inode blocks: 4 bits
    writeBits(buffer, superblock.inodeBlocks, bitOffset, 4)
    bitOffset += 4
    
    // Data blocks: 4 bits
    writeBits(buffer, superblock.dataBlocks, bitOffset, 4)
    bitOffset += 4
    
    // Block size: 24 bits
    writeBits(buffer, superblock.blockSize, bitOffset, 24)
    
    return buffer
}

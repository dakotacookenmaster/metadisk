import BuildSuperBlockData from "../../interfaces/vsfs/BuildSuperblockData.interface"

export default function buildSuperblock(superblock: BuildSuperBlockData): Uint8Array {
    const magicNumber = superblock.magicNumber // 7 is the magic number indicating VSFS
    const inodeCount = superblock.inodeCount // the number of inodes in the system (need 16 bits to encode)
    const inodeBlocks = superblock.inodeBlocks // the number of blocks containing inodes
    const dataBlocks = superblock.dataBlocks // the number of datablocks in the system
    const writableBlockSize = superblock.blockSize // the total block size

    const superblockData = new Uint8Array(7)
    superblockData[0] = magicNumber // 7 is the magic number, indicating VSFS (1 byte)
    superblockData[1] = inodeCount >> 8 // the number of inodes in the system (1st byte of 2 bytes)
    superblockData[2] = inodeCount & 0xFF // the number of inodes in the system (2nd byte of 2 bytes)
    superblockData[3] = (inodeBlocks << 4) | (dataBlocks & 0xF) // the number of blocks containing inodes (4 bits)
    superblockData[4] = writableBlockSize >> 16 // total block size (1st byte of 3 bytes)
    superblockData[5] = (writableBlockSize >> 8) & 0xFF // total block size (2nd byte of 3 bytes)
    superblockData[6] = writableBlockSize & 0xFF // total block size (3rd byte of 3 bytes)

    return superblockData
}

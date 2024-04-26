import BuildSuperBlockData from "../../interfaces/vsfs/BuildSuperblockData.interface"

export default function buildSuperblock(superblock: BuildSuperBlockData): string {
    const magicNumber = superblock.magicNumber.toString(2).padStart(8, "0") // 7 is the magic number indicating VSFS
    const inodeCount = superblock.inodeCount.toString(2).padStart(16, "0") // the number of inodes in the system (need 16 bits to encode)
    const inodeBlocks = superblock.inodeBlocks.toString(2).padStart(4, "0") // the number of blocks containing inodes
    const dataBlocks = superblock.dataBlocks.toString(2).padStart(4, "0") // the number of datablocks in the system

    const writableBlockSize = superblock.blockSize.toString(2).padStart(24, "0")
    const superblockData =
        magicNumber + inodeCount + inodeBlocks + dataBlocks + writableBlockSize

    return superblockData
}

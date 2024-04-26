export default interface BuildSuperBlockData {
    blockSize: number
    sectorSize: number
    inodeStartIndex: number
    magicNumber: number
    inodeCount: number
    inodeBlocks: number
    dataBlocks: number
}
import DirectoryEntry from "./DirectoryEntry.interface"
import InodeData from "./InodeData.interface"

export default interface ReadBlockPayload {
    data: {
        superblock: {
            magicNumber: number
            inodeCount: number
            inodeBlocks: number
            dataBlocks: number
            blockSize: number
        }
        directory: {
            entries: DirectoryEntry[]
        }
        inodes: InodeData[]
        raw: string
    }
    sectors: number[]
}
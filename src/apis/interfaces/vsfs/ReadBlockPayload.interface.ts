import DirectoryEntry from "./DirectoryEntry.interface"
import InodeData from "./InodeData.interface"

export default interface ReadBlockPayload {
    readonly data: {
        readonly superblock: {
            readonly magicNumber: number
            readonly inodeCount: number
            readonly inodeBlocks: number
            readonly dataBlocks: number
            readonly blockSize: number
        }
        readonly directory: {
            readonly entries: DirectoryEntry[]
        }
        readonly inodes: InodeData[]
        readonly raw: string
    }
    readonly sectors: number[]
}
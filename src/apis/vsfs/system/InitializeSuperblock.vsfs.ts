import {
    selectBlockSize,
    selectSectorSize,
    selectSuperblock,
} from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import Permissions from "../../enums/vsfs/Permissions.enum"
import buildDirectory from "./BuildDirectory.vsfs"
import buildInode from "./BuildInode.vsfs"
import buildSuperblock from "./BuildSuperblock.vsfs"
import { writeBlocks } from "./WriteBlocks.vsfs"
import { clearCache, warmupMetadata } from "./BlockCache.vsfs"
/**
 * Initializes the superblock, the inode and data bitmaps, and the root directory
 */
export default async function initializeSuperblock() {
    const state = store.getState()
    const superblock = selectSuperblock(state)
    const blockSize = selectBlockSize(state)
    const sectorSize = selectSectorSize(state)
    const { inodeStartIndex } = superblock

    const superblockData = buildSuperblock({
        magicNumber: superblock.magicNumber,
        inodeCount: superblock.numberOfInodes,
        blockSize: blockSize,
        dataBlocks: superblock.numberOfDataBlocks,
        inodeBlocks: superblock.numberOfInodeBlocks,
        inodeStartIndex: superblock.inodeStartIndex,
        sectorSize,
    })

    // Create bitmap with first bit set to 1, rest to 0
    const bitmapBytes = sectorSize / 8
    const bitmap = new Uint8Array(bitmapBytes)
    bitmap[0] = 0b10000000 // First bit is 1, rest are 0

    const timestamp = new Date()

    const rootInodeData = buildInode({
        type: "directory",
        permissions: Permissions.READ_WRITE,
        createdAt: timestamp,
        lastModified: timestamp,
        size: 256,
        blockPointers: [3 + superblock.numberOfInodeBlocks, 0, 0, 0, 0, 0, 0, 0],
    })

    const rootDirectoryData = buildDirectory({
        entries: [
            {
                name: ".",
                inode: 0,
            },
            {
                name: "..",
                inode: 0,
            },
        ],
    })

    const rootDirectoryBlock = superblock.numberOfInodeBlocks + inodeStartIndex

    // Clear any existing cache before writing new superblock
    clearCache()
    
    await writeBlocks(
        [0, 1, 2, 3, rootDirectoryBlock],
        [superblockData, bitmap, bitmap, rootInodeData, rootDirectoryData],
    )
    
    // Warm up the cache with critical metadata blocks after initialization
    await warmupMetadata()
}

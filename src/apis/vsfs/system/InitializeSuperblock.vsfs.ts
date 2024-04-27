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
/**
 * Initializes the superblock, the inode and data bitmaps, and the root directory
 * @param progressCb A callback executed whenever the initialization progress changes
 */
export default async function initializeSuperblock(
    progressCb: (progress: number) => void,
) {
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

    progressCb(0)

    const bitmap = "1" + "0".repeat(sectorSize - 1)

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

    await writeBlocks(
        [0, 1, 2, 3, rootDirectoryBlock],
        [superblockData, bitmap, bitmap, rootInodeData, rootDirectoryData],
        (progress) => {
            progressCb(progress)
        },
    )
}

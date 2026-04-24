import Directories from "../interfaces/Directories.interface"
import { store } from "../../../store"
import { selectBlockSize, selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { readBlocks } from "../../../apis/vsfs/system/ReadBlocks.vsfs"
import { readBlock } from "../../../apis/vsfs/system/BlockCache.vsfs"

/**
 * Determines which blocks contain directory information, and returns those block numbers
 *
 * @param appId Optional id of the app initiating these reads. When invoked
 *   from inside a React component, callers should obtain this from
 *   `usePosix().appId` rather than hard-coding it, so the Disk Simulator
 *   can attribute the resulting block reads to the correct app icon.
 */
const getAllDirectories = async (appId?: string): Promise<Directories> => {
    const state = store.getState()
    const { inodeStartIndex, numberOfInodeBlocks, inodeSize } = selectSuperblock(state)
    const blockSize = selectBlockSize(state)
    const inodeBlockNumbers = [...Array(numberOfInodeBlocks)].map(
        (_, index) => index + inodeStartIndex,
    )
    const inodesPerBlock = blockSize / inodeSize

    const inodeBlocks = await readBlocks(inodeBlockNumbers, undefined, appId)
    const inodeBitmap = (await readBlock(1, undefined, appId)).data.raw
    const directoryBlockNumbers = []
    
    for (const [inodeBlockIndex, inodeBlock] of inodeBlocks.entries()) {
        for (const [localInodeIndex, inode] of inodeBlock.data.inodes.entries()) {
            const globalInodeIndex = inodeBlockIndex * inodesPerBlock + localInodeIndex
            const byteIndex = Math.floor(globalInodeIndex / 8)
            const bitIndex = 7 - (globalInodeIndex % 8) // MSB first
            const isInodeAllocated = (inodeBitmap[byteIndex] & (1 << bitIndex)) !== 0
            
            if (isInodeAllocated && inode.type === "directory") {
                directoryBlockNumbers.push(
                    ...inode.blockPointers.filter((v) => v),
                )
            }
        }
    }

    return {
        blocks: directoryBlockNumbers,
    }
}

export default getAllDirectories

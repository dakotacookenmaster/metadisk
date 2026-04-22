import Directories from "../interfaces/Directories.interface"
import { store } from "../../../store"
import { selectBlockSize, selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { readBlocks } from "../../../apis/vsfs/system/ReadBlocks.vsfs"
import { readBlock } from "../../../apis/vsfs/system/BlockCache.vsfs"

/**
 * Determines which blocks contain directory information, and returns those block numbers
 */
const getAllDirectories = async (): Promise<Directories> => {
    const state = store.getState()
    const { inodeStartIndex, numberOfInodeBlocks, inodeSize } = selectSuperblock(state)
    const blockSize = selectBlockSize(state)
    const inodeBlockNumbers = [...Array(numberOfInodeBlocks)].map(
        (_, index) => index + inodeStartIndex,
    )
    const inodesPerBlock = blockSize / inodeSize

    const inodeBlocks = await readBlocks(inodeBlockNumbers)
    const inodeBitmap = (await readBlock(1)).data.raw
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

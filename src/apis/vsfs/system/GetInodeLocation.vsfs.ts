import { selectBlockSize, selectSuperblock } from "../../../redux/reducers/fileSystemSlice";
import { store } from "../../../store";
import InodeLocation from "../../interfaces/vsfs/InodeLocation.interface";

/**
 * Given an inode number, find the block that inode resides in, as well as its offset in that block
 * @param inode The inode number you want to find the location of
 * @returns 
 */
export default function getInodeLocation(inode: number): InodeLocation {
    const state = store.getState()
    const { inodeSize, inodeStartIndex } = selectSuperblock(state)
    const blockSize = selectBlockSize(state)
    const inodesPerBlock = blockSize / inodeSize
    
    return {
        inodeBlock: Math.floor(inode / inodesPerBlock) + inodeStartIndex,
        inodeOffset: inode % inodesPerBlock
    }
}
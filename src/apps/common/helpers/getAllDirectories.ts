import Directories from "../interfaces/Directories.interface"
import { store } from "../../../store"
import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { readBlocks } from "../../../apis/vsfs/system/ReadBlocks.vsfs"

const getAllDirectories = async (): Promise<Directories> => {
    const state = store.getState()
    const { inodeStartIndex, numberOfInodeBlocks } = selectSuperblock(state)
    const inodeBlockNumbers = [...Array(numberOfInodeBlocks)].map((_, index) => index + inodeStartIndex)

    const inodeBlocks = await readBlocks(inodeBlockNumbers)
    const directoryBlockNumbers = []
    for(let inodeBlock of inodeBlocks) {
        for(let inode of inodeBlock.data.inodes) {
            if(inode.type === "directory") {
                directoryBlockNumbers.push(...inode.blockPointers.filter(v => v))
            }
        }
    }

    return {
        blocks: directoryBlockNumbers
    }
}

export default getAllDirectories
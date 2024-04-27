import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"

const getLabel = (index: number) => {
    const state = store.getState()
    const { numberOfInodeBlocks, inodeStartIndex } = selectSuperblock(state)
    if (index === 0) {
        return "Superblock"
    } else if (index === 1) {
        return "Inode Bitmap"
    } else if (index === 2) {
        return "Data Bitmap"
    } else if (index <= 2 + numberOfInodeBlocks) {
        return `Inode Block ${index - inodeStartIndex}`
    } else {
        return `Data Block ${index - inodeStartIndex - numberOfInodeBlocks}`
    }
}

export default getLabel
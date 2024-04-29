import Directories from "../interfaces/Directories.interface"
import { store } from "../../../store"
import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { readBlocks } from "../../../apis/vsfs/system/ReadBlocks.vsfs"
import { readBlock } from "../../../apis/vsfs/system/ReadBlock.vsfs"

const getAllDirectories = async (): Promise<Directories> => {
    const state = store.getState()
    const { inodeStartIndex, numberOfInodeBlocks } = selectSuperblock(state)
    const inodeBlockNumbers = [...Array(numberOfInodeBlocks)].map(
        (_, index) => index + inodeStartIndex,
    )

    const inodeBlocks = await readBlocks(inodeBlockNumbers)
    const inodeBitmap = (await readBlock(1)).data.raw
    const directoryBlockNumbers = []
    for (let inodeBlock of inodeBlocks) {
        for (let inode of inodeBlock.data.inodes.filter(
            (_, index) => inodeBitmap[index] === "1",
        )) {
            if (inode.type === "directory") {
                directoryBlockNumbers.push(
                    ...inode.blockPointers.filter((v) => v),
                )
            }
        }
    }

    console.log("DIRECTORY BLOCK NUMBERS:", directoryBlockNumbers)

    return {
        blocks: directoryBlockNumbers,
    }
}

export default getAllDirectories

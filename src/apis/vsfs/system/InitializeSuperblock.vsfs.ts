import { getCharacterEncoding } from "../../../apps/vsfs/components/Viewers"
import { selectBlockSize, selectSectorSize, selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { writeBlocks } from "./WriteBlocks.vsfs"

export default async function initializeSuperblock(
    progressCb: (progress: number) => void,
) {
    const state = store.getState()
    const superblock = selectSuperblock(state)
    const blockSize = selectBlockSize(state)
    const sectorSize = selectSectorSize(state)
    const magicNumber = superblock.magicNumber.toString(2).padStart(8, "0") // 7 is the magic number indicating VSFS
    const inodeCount = superblock.numberOfInodes.toString(2).padStart(16, "0") // the number of inodes in the system (need 16 bits to encode)
    const inodeBlocks = superblock.numberOfInodeBlocks
        .toString(2)
        .padStart(4, "0") // the number of blocks containing inodes
    const dataBlocks = superblock.numberOfDataBlocks
        .toString(2)
        .padStart(4, "0") // the number of datablocks in the system

    const writableBlockSize = blockSize.toString(2).padStart(24, "0")
    const superblockData =
        magicNumber + inodeCount + inodeBlocks + dataBlocks + writableBlockSize
    const bitmap = "1" + "0".repeat(sectorSize - 1)

    progressCb(0)

    const timestamp = Math.floor(Date.now() / 1000)
        .toString(2)
        .padStart(32, "0")

    const rootInodeData: string = [
        "01010100", // Type: 📂, Read ✅, Write ✅, Execute ❌ ==> 1 byte
        "000000000000000100000000", // How many bytes are in this file? ==> 3 bytes (for root directory)
        timestamp, // What time was this file created? ==> 4 bytes
        timestamp, // What time was this file last accessed? ==> 4 bytes
        (3 + superblock.numberOfInodeBlocks).toString(2).padStart(4, "0") +
            [...Array(7)].map(() => "0".repeat(4)).join(""), // initialize block pointers ==> 4 bytes
    ].join("")

    const rootDirectoryData: string = [
        // . directory
        "00000000".repeat(12), // 12 null characters
        getCharacterEncoding(".").toString(2).padStart(8, "0"), // get . as ASCII
        "00000000".repeat(3), // inode number

        // .. directory
        "00000000".repeat(11), // 11 null characters
        getCharacterEncoding(".").toString(2).padStart(8, "0").repeat(2), // .. as ASCII
        "00000000".repeat(3), // inode number
    ].join("")

    const rootDirectoryBlock = superblock.numberOfInodeBlocks + 3

    await writeBlocks(
        [0, 1, 2, 3, rootDirectoryBlock],
        [superblockData, bitmap, bitmap, rootInodeData, rootDirectoryData],
        (progress) => {
            progressCb(progress)
        },
    )
}

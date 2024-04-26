import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store"
interface FileSystemState {
    sectorSize: number
    sectorsPerBlock: number
    blockSize: number
    totalBlocks: number
    minimumRequiredDiskSize: number
    isFinishedConfiguringFileSystem: boolean
    isAwaitingDisk: boolean
    isDiskFormatted: boolean
    // fileDescriptorTable: (FileDescriptor | null)[]
    superblock: {
        name: string
        magicNumber: number
        inodeSize: number
        numberOfInodeBlocks: number
        numberOfDataBlocks: number
        numberOfInodes: number
        inodeStartIndex: number
    }
}

// export interface FileDescriptor {
//     path: string,
//     inode: number,
//     flags: OpenFlags[]
// }

/**
 * Takes the total number of blocks in the system (INCLUDING the superblock, i-bmap, and d-bmap)
 * and returns an object containing the number of blocks that should be allocated to inodes and
 * the number that should be allocated to data.
 * @param {number} totalBlocks
 * @returns
 */
const calculateInodeAndDataBlocks = (
    totalBlocks: number,
    inodesPerBlock: number,
    inodeStartIndex: number
) => {
    let inodeTotalCount = 0
    let availableDataBlocks = totalBlocks - inodeStartIndex // account for the superblock, i-bmap, and d-bmap
    while (inodeTotalCount < availableDataBlocks) {
        availableDataBlocks--
        inodeTotalCount += inodesPerBlock
    }
    const inodeBlocks = Math.ceil(inodeTotalCount / inodesPerBlock)

    return {
        inodeBlocks,
        dataBlocks: totalBlocks - inodeBlocks - inodeStartIndex,
    }
}

const initialState: FileSystemState = {
    isFinishedConfiguringFileSystem: false,
    isAwaitingDisk: false,
    sectorSize: 4096,
    sectorsPerBlock: 4,
    blockSize: 4096 * 4,
    totalBlocks: 16,
    minimumRequiredDiskSize: 4096 * 4 * 16,
    // fileDescriptorTable: [null, null, null],
    isDiskFormatted: false,
    superblock: {
        name: "Very Simple File System (vsfs)",
        magicNumber: 7,
        inodeSize: 128,
        numberOfInodeBlocks: calculateInodeAndDataBlocks(16, 32, 3).inodeBlocks,
        numberOfDataBlocks: calculateInodeAndDataBlocks(16, 32, 3).dataBlocks,
        numberOfInodes: calculateInodeAndDataBlocks(16, 32, 3).inodeBlocks * 128,
        inodeStartIndex: 3,
    },
}

export const fileSystemSlice = createSlice({
    name: "fileSystem",
    initialState,
    reducers: {
        setSectorSize: (state, action: PayloadAction<number>) => {
            state.sectorSize = action.payload
            state.blockSize = state.sectorSize * state.sectorsPerBlock
            state.minimumRequiredDiskSize =
                state.sectorSize * state.sectorsPerBlock * state.totalBlocks
            const inodesPerBlock = state.blockSize / state.superblock.inodeSize
            const { inodeBlocks, dataBlocks } = calculateInodeAndDataBlocks(
                state.totalBlocks,
                inodesPerBlock,
                state.superblock.inodeStartIndex
            )
            state.superblock.numberOfInodeBlocks = inodeBlocks
            state.superblock.numberOfDataBlocks = dataBlocks
            state.superblock.numberOfInodes =
                state.superblock.numberOfInodeBlocks * inodesPerBlock
        },
        setSectorsPerBlock: (state, action: PayloadAction<number>) => {
            state.sectorsPerBlock = action.payload
            state.blockSize = state.sectorSize * state.sectorsPerBlock
            state.minimumRequiredDiskSize =
                state.sectorSize * state.sectorsPerBlock * state.totalBlocks
            const inodesPerBlock = state.blockSize / state.superblock.inodeSize
            const { inodeBlocks, dataBlocks } = calculateInodeAndDataBlocks(
                state.totalBlocks,
                inodesPerBlock,
                state.superblock.inodeStartIndex
            )
            state.superblock.numberOfInodeBlocks = inodeBlocks
            state.superblock.numberOfDataBlocks = dataBlocks
            state.superblock.numberOfInodes =
                state.superblock.numberOfInodeBlocks * inodesPerBlock
        },
        setTotalBlocks: (state, action: PayloadAction<number>) => {
            state.totalBlocks = action.payload
            state.minimumRequiredDiskSize =
                state.sectorSize * state.sectorsPerBlock * state.totalBlocks
            const inodesPerBlock = state.blockSize / state.superblock.inodeSize
            const { inodeBlocks, dataBlocks } = calculateInodeAndDataBlocks(
                state.totalBlocks,
                inodesPerBlock,
                state.superblock.inodeStartIndex
            )
            state.superblock.numberOfInodeBlocks = inodeBlocks
            state.superblock.numberOfDataBlocks = dataBlocks
            state.superblock.numberOfInodes =
                state.superblock.numberOfInodeBlocks * inodesPerBlock
        },
        setIsFinishedConfiguringFileSystem: (
            state,
            action: PayloadAction<boolean>,
        ) => {
            state.isFinishedConfiguringFileSystem = action.payload
        },
        setIsAwaitingDisk: (state, action: PayloadAction<boolean>) => {
            state.isAwaitingDisk = action.payload
        },
        setIsDiskFormatted: (state, action: PayloadAction<boolean>) => {
            state.isDiskFormatted = action.payload
        },
        // addFileDescriptor: (state, action: PayloadAction<FileDescriptor>) => {
        //     state.fileDescriptorTable.push(action.payload)
        // },
        // removeFileDescriptor: (state, action: PayloadAction<number>) => {
        //     state.fileDescriptorTable = state.fileDescriptorTable.splice(action.payload, 1)
        // },
    },
})



export const {
    setSectorSize,
    setIsFinishedConfiguringFileSystem,
    setSectorsPerBlock,
    setTotalBlocks,
    setIsAwaitingDisk,
    setIsDiskFormatted,
    // addFileDescriptor,
    // removeFileDescriptor
} = fileSystemSlice.actions

export const selectSectorSize = (state: RootState) =>
    state.fileSystem.sectorSize
export const selectSectorsPerBlock = (state: RootState) =>
    state.fileSystem.sectorsPerBlock
export const selectBlockSize = (state: RootState) => state.fileSystem.blockSize
export const selectName = (state: RootState) => state.fileSystem.superblock.name
export const selectTotalBlocks = (state: RootState) =>
    state.fileSystem.totalBlocks
export const selectMinimumRequiredDiskSize = (state: RootState) =>
    state.fileSystem.minimumRequiredDiskSize
export const selectFileSystem = (state: RootState) => state.fileSystem
export const selectIsFinishedConfiguringFileSystem = (state: RootState) =>
    state.fileSystem.isFinishedConfiguringFileSystem
export const selectSuperblock = (state: RootState) =>
    state.fileSystem.superblock
export const selectIsAwaitingDisk = (state: RootState) =>
    state.fileSystem.isAwaitingDisk
export const selectIsDiskFormatted = (state: RootState) =>
    state.fileSystem.isDiskFormatted
// export const selectFileDescriptorTable = (state: RootState) => state.fileSystem.fileDescriptorTable

export default fileSystemSlice.reducer

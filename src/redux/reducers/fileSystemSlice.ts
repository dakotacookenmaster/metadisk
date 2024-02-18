import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { AppDispatch, RootState } from "../../store"
import { setSectors } from "./diskSlice"
interface FileSystemState {
    sectorSize: number
    sectorsPerBlock: number
    blockSize: number
    totalBlocks: number
    minimumRequiredDiskSize: number
    isFinishedConfiguringFileSystem: boolean
    isAwaitingDisk: boolean
    superblock: {
        name: string
        magicNumber: number
        binaryData: string
        inodeSize: number
        numberOfInodeBlocks: number
        numberOfDataBlocks: number
        numberOfInodes: number
        startIndex: number
    }
}

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
) => {
    let inodeTotalCount = 0
    let availableDataBlocks = totalBlocks - 3 // account for the superblock, i-bmap, and d-bmap
    while (inodeTotalCount <= availableDataBlocks) {
        availableDataBlocks = availableDataBlocks - 1
        inodeTotalCount += inodesPerBlock
    }
    const inodeBlocks = Math.ceil(inodeTotalCount / inodesPerBlock)
    return {
        inodeBlocks,
        dataBlocks: totalBlocks - inodeBlocks - 3,
    }
}

const existingState: string | null = localStorage?.getItem("fileSystem")

const initialState: FileSystemState = existingState
    ? JSON.parse(existingState)
    : {
          isFinishedConfiguringFileSystem: false,
          isAwaitingDisk: false,
          sectorSize: 512,
          sectorsPerBlock: 2,
          blockSize: 512 * 2,
          totalBlocks: 16,
          minimumRequiredDiskSize: 512 * 2 * 16,
          superblock: {
            name: "Very Simple File System (vsfs)",
            magicNumber: 7,
            inodeSize: 512,
            numberOfInodeBlocks: calculateInodeAndDataBlocks(16, 2).inodeBlocks,
            numberOfDataBlocks: calculateInodeAndDataBlocks(16, 2).dataBlocks,
            numberOfInodes: calculateInodeAndDataBlocks(16, 2).inodeBlocks * 2,
            startIndex: 3
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
            const { inodeBlocks, dataBlocks } = calculateInodeAndDataBlocks(
                state.totalBlocks,
                state.blockSize / state.superblock.inodeSize,
            )
            state.superblock.numberOfInodeBlocks = inodeBlocks
            state.superblock.numberOfDataBlocks = dataBlocks
            state.superblock.numberOfInodes =
                state.superblock.numberOfInodeBlocks *
                (state.blockSize / state.superblock.inodeSize)
        },
        setSectorsPerBlock: (state, action: PayloadAction<number>) => {
            state.sectorsPerBlock = action.payload
            state.blockSize = state.sectorSize * state.sectorsPerBlock
            state.minimumRequiredDiskSize =
                state.sectorSize * state.sectorsPerBlock * state.totalBlocks
            const { inodeBlocks, dataBlocks } = calculateInodeAndDataBlocks(
                state.totalBlocks,
                state.blockSize / state.superblock.inodeSize,
            )
            state.superblock.numberOfInodeBlocks = inodeBlocks
            state.superblock.numberOfDataBlocks = dataBlocks
            state.superblock.numberOfInodes =
                state.superblock.numberOfInodeBlocks *
                (state.blockSize / state.superblock.inodeSize)
        },
        setTotalBlocks: (state, action: PayloadAction<number>) => {
            state.totalBlocks = action.payload
            state.minimumRequiredDiskSize =
                state.sectorSize * state.sectorsPerBlock * state.totalBlocks
            const { inodeBlocks, dataBlocks } = calculateInodeAndDataBlocks(
                state.totalBlocks,
                state.blockSize / state.superblock.inodeSize,
            )
            state.superblock.numberOfInodeBlocks = inodeBlocks
            state.superblock.numberOfDataBlocks = dataBlocks
            state.superblock.numberOfInodes =
                state.superblock.numberOfInodeBlocks *
                (state.blockSize / state.superblock.inodeSize)
        },
        setIsFinishedConfiguringFileSystem: (
            state,
            action: PayloadAction<boolean>,
        ) => {
            state.isFinishedConfiguringFileSystem = action.payload
        },
        setIsAwaitingDisk: (state, action: PayloadAction<boolean>) => {
            state.isAwaitingDisk = action.payload
        }
    },
})

export const {
    setSectorSize,
    setIsFinishedConfiguringFileSystem,
    setSectorsPerBlock,
    setTotalBlocks,
    setIsAwaitingDisk
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
export const selectIsAwaitingDisk = (state: RootState) => state.fileSystem.isAwaitingDisk

export default fileSystemSlice.reducer

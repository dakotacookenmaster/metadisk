import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store"
interface FileSystemState {
    name: string,
    sectorSize: number,
    sectorsPerBlock: number,
    blockSize: number,
    totalBlocks: number,
    minimumRequiredDiskSize: number,
    isFinishedConfiguringFileSystem: boolean
}

const existingState: string | null = localStorage.getItem('fileSystem')

const initialState: FileSystemState = existingState ? JSON.parse(existingState) : {
    name: "Very Simple File System (vsfs)",
    isFinishedConfiguringFileSystem: false,
    sectorSize: 512,
    sectorsPerBlock: 2,
    blockSize: 512 * 2,
    totalBlocks: 16,
    minimumRequiredDiskSize: 512 * 2 * 16
}

export const fileSystemSlice = createSlice({
    name: "fileSystem",
    initialState,
    reducers: {
        setSectorSize: (state, action: PayloadAction<number>) => {
            state.sectorSize = action.payload
            state.blockSize = state.sectorSize * state.sectorsPerBlock
            state.minimumRequiredDiskSize = state.sectorSize * state.sectorsPerBlock * state.totalBlocks
        },
        setSectorsPerBlock: (state, action: PayloadAction<number>) => {
            state.sectorsPerBlock = action.payload
            state.blockSize = state.sectorSize * state.sectorsPerBlock
            state.minimumRequiredDiskSize = state.sectorSize * state.sectorsPerBlock * state.totalBlocks
        },
        setTotalBlocks: (state, action: PayloadAction<number>) => {
            state.totalBlocks = action.payload
            state.minimumRequiredDiskSize = state.sectorSize * state.sectorsPerBlock * state.totalBlocks
        },
        setIsFinishedConfiguringFileSystem: (state, action: PayloadAction<boolean>) => {
            state.isFinishedConfiguringFileSystem = action.payload
        }
    },
})

export const { setSectorSize, setIsFinishedConfiguringFileSystem, setSectorsPerBlock, setTotalBlocks } = fileSystemSlice.actions
export const selectSectorSize = (state: RootState) => state.fileSystem.sectorSize
export const selectSectorsPerBlock = (state: RootState) => state.fileSystem.sectorsPerBlock
export const selectBlockSize = (state: RootState) => state.fileSystem.blockSize
export const selectName = (state: RootState) => state.fileSystem.name
export const selectTotalBlocks = (state: RootState) => state.fileSystem.totalBlocks
export const selectMinimumRequiredDiskSize = (state: RootState) => state.fileSystem.minimumRequiredDiskSize
export const selectFileSystem = (state: RootState) => state.fileSystem
export const selectIsFinishedConfiguringFileSystem = (state: RootState) => state.fileSystem.isFinishedConfiguringFileSystem
export default fileSystemSlice.reducer
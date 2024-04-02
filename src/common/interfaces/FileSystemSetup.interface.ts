import { AppDispatch } from "../../store"

export default interface FileSystemSetup {
    name: string
    blockSize: number
    sectorSize: number
    sectorsPerBlock: number
    minimumRequiredDiskSize: number
    totalBlocks: number
    setTotalBlocks: (value: number) => ReturnType<AppDispatch>
    setSectorSize: (value: number) => ReturnType<AppDispatch>
    setSectorsPerBlock: (value: number) => ReturnType<AppDispatch>
    setIsFinishedConfiguringFileSystem: (
        value: boolean,
    ) => ReturnType<AppDispatch>
    setIsAwaitingDisk: (value: boolean) => ReturnType<AppDispatch>
}
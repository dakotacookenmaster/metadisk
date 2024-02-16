import { Box, Paper, Typography, useTheme } from "@mui/material"
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks"
import {
    selectBlockSize,
    selectIsAwaitingDisk,
    selectIsFinishedConfiguringFileSystem,
    selectMinimumRequiredDiskSize,
    selectName,
    selectSectorSize,
    selectSectorsPerBlock,
    selectTotalBlocks,
    setIsAwaitingDisk,
    setIsFinishedConfiguringFileSystem,
    setSectorSize,
    setSectorsPerBlock,
    setTotalBlocks,
} from "../../redux/reducers/fileSystemSlice"
import SetUpFileSystem from "./components/SetUpFileSystem"
import { AppDispatch } from "../../store"
import FileSystemBlockLayout from "./components/FileSystemBlockLayout"
import AwaitingDiskConfiguration from "./components/AwaitingDiskConfiguration"

export interface FileSystemSetup {
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

const VSFS = () => {
    const theme = useTheme()
    const name = useAppSelector(selectName)
    const totalBlocks = useAppSelector(selectTotalBlocks)
    const blockSize = useAppSelector(selectBlockSize)
    const sectorSize = useAppSelector(selectSectorSize)
    const isAwaitingDisk = useAppSelector(selectIsAwaitingDisk)
    const sectorsPerBlock = useAppSelector(selectSectorsPerBlock)
    const minimumRequiredDiskSize = useAppSelector(
        selectMinimumRequiredDiskSize,
    )
    const isFinishedConfiguringFileSystem = useAppSelector(
        selectIsFinishedConfiguringFileSystem,
    )
    const dispatch = useAppDispatch()

    return (
        <Paper
            sx={{
                padding: theme.spacing(2),
                height: "100%",
            }}
        >
            {!isFinishedConfiguringFileSystem && (
                <SetUpFileSystem
                    name={name}
                    blockSize={blockSize}
                    sectorSize={sectorSize}
                    sectorsPerBlock={sectorsPerBlock}
                    minimumRequiredDiskSize={minimumRequiredDiskSize}
                    setSectorSize={(value: number) =>
                        dispatch(setSectorSize(value))
                    }
                    setSectorsPerBlock={(value: number) =>
                        dispatch(setSectorsPerBlock(value))
                    }
                    setIsFinishedConfiguringFileSystem={(value: boolean) =>
                        dispatch(setIsFinishedConfiguringFileSystem(value))
                    }
                    totalBlocks={totalBlocks}
                    setTotalBlocks={(value: number) =>
                        dispatch(setTotalBlocks(value))
                    }
                    setIsAwaitingDisk={(value: boolean) => dispatch(setIsAwaitingDisk(value))}
                />
            )}
            {isFinishedConfiguringFileSystem && isAwaitingDisk && (
                <AwaitingDiskConfiguration />
            )}
            {isFinishedConfiguringFileSystem && !isAwaitingDisk && (
                <FileSystemBlockLayout />
            )}
        </Paper>
    )
}

export default VSFS

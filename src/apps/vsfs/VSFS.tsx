import { Paper, useTheme } from "@mui/material"
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks"
import {
    selectBlockSize,
    selectIsAwaitingDisk,
    selectIsDiskFormatted,
    selectIsFinishedConfiguringFileSystem,
    selectMinimumRequiredDiskSize,
    selectName,
    selectSectorSize,
    selectSectorsPerBlock,
    selectTotalBlocks,
    setIsAwaitingDisk,
    setIsDiskFormatted,
    setIsFinishedConfiguringFileSystem,
    setSectorSize,
    setSectorsPerBlock,
    setTotalBlocks,
} from "../../redux/reducers/fileSystemSlice"
import SetUpFileSystem from "./components/SetUpFileSystem"
import FileSystemBlockLayout from "./components/FileSystemBlockLayout"
import WaitingMessage from "../common/components/WaitingMessage"
import { useEffect, useState } from "react"
import initializeSuperblock from "../../apis/vsfs/system/InitializeSuperblock.vsfs"

export default function VSFS() {
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
    const isDiskFormatted = useAppSelector(selectIsDiskFormatted)
    const [waitingMessage, setWaitingMessage] = useState<null | {
        title: string
        message: string
    }>(null)
    const [progress, setProgress] = useState<number>(0)
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (
            isFinishedConfiguringFileSystem &&
            !isAwaitingDisk &&
            !isDiskFormatted
        ) {
            ;(async () => {
                setProgress(0)
                setWaitingMessage({
                    title: "Formatting Disk",
                    message: "Please wait...",
                })
                await initializeSuperblock(setProgress)
                setWaitingMessage(null)
                dispatch(setIsDiskFormatted(true))
            })()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFinishedConfiguringFileSystem, isAwaitingDisk])

    return (
        <Paper
            sx={{
                pt: theme.spacing(1.3),
                pb: theme.spacing(2),
                px: theme.spacing(2),
                height: "100%",
                flexGrow: 1,
                flexBasis: "50%",
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
                    setIsAwaitingDisk={(value: boolean) =>
                        dispatch(setIsAwaitingDisk(value))
                    }
                />
            )}
            {isFinishedConfiguringFileSystem && isAwaitingDisk && (
                <WaitingMessage
                    title="Set Up Your File System"
                    message="Waiting for disk..."
                />
            )}
            {isFinishedConfiguringFileSystem &&
                !isAwaitingDisk &&
                waitingMessage && (
                    <WaitingMessage
                        title={waitingMessage.title}
                        message={waitingMessage.message}
                        progress={progress}
                    />
                )}
            {isFinishedConfiguringFileSystem &&
                !isAwaitingDisk &&
                isDiskFormatted &&
                !waitingMessage && <FileSystemBlockLayout />}
        </Paper>
    )
}

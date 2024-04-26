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
import open from "../../apis/vsfs/posix/open.vsfs"
import OpenFlags from "../../apis/enums/vsfs/OpenFlags.enum"
import Permissions from "../../apis/enums/vsfs/Permissions.enum"

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
            (async () => {
                setProgress(0)
                setWaitingMessage({
                    title: "Formatting Disk",
                    message: "Please wait...",
                })
                await initializeSuperblock(setProgress)
                setWaitingMessage({ title: "Initializing...", message: "Creating Some Files..."})
                await open("/abc", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                await open("/abc1", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                await open("/abc5", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                await open("/abc6", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                await open("/abc7", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                await open("/abc8", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                await open("/abc9", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                setWaitingMessage(null)
                dispatch(setIsDiskFormatted(true))

                setTimeout(async () => {
                    await open("/abc2", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                    await open("/abc3", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                    await open("/abc4", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                    await open("/abc4", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                    await open("/abc4", [OpenFlags.O_RDWR, OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)
                }, 3000)
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

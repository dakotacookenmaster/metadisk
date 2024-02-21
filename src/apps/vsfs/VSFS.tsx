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
    selectSuperblock,
    selectTotalBlocks,
    setIsAwaitingDisk,
    setIsDiskFormatted,
    setIsFinishedConfiguringFileSystem,
    setSectorSize,
    setSectorsPerBlock,
    setTotalBlocks,
} from "../../redux/reducers/fileSystemSlice"
import SetUpFileSystem from "./components/SetUpFileSystem"
import { AppDispatch } from "../../store"
import FileSystemBlockLayout from "./components/FileSystemBlockLayout"
import WaitingMessage from "../common/components/WaitingMessage"
import { useEffect, useState } from "react"
import dec2bin from "../common/helpers/dec2bin"
import { writeBlock } from "../../apis/vsfs"

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
    const superblock = useAppSelector(selectSuperblock)
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
                // Start writing the Superblock
                const magicNumber = dec2bin(superblock.magicNumber) // 7 is the magic number indicating VSFS
                const inodeCount = dec2bin(superblock.numberOfInodes) // the number of inodes in the system
                const inodeBlocks = dec2bin(superblock.numberOfInodeBlocks) // the number of blocks containing inodes
                const dataBlocks = dec2bin(superblock.numberOfDataBlocks) // the number of datablocks in the system
                const superblockData =
                    magicNumber + inodeCount + inodeBlocks + dataBlocks
                const bitmap = "0".repeat(sectorSize)

                setProgress(0)
                setWaitingMessage({
                    title: "Formatting Disk",
                    message: "Please wait...",
                })

                const progressUpdate = (progress: number, taskCount: number) => {
                    setProgress((prevProgress) => {
                        return prevProgress + (progress * (1 / taskCount))
                    })
                }

                // write to the first block
                const superblockRequest = writeBlock(
                    0,
                    superblockData,
                    progressUpdate,
                )

                // write the inode bitmap
                const inodeBitmapRequest = writeBlock(1, bitmap, progressUpdate)

                // write the data bitmap
                const dataBitmapRequest = writeBlock(
                    2,
                    bitmap,
                    progressUpdate,
                )

                await Promise.all([
                    superblockRequest,
                    inodeBitmapRequest,
                    dataBitmapRequest,
                ])

                setWaitingMessage(null)

                dispatch(setIsDiskFormatted(true))
            })()
        }
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

export default VSFS

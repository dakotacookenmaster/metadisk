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
import { writeBlocks } from "../../apis/vsfs"

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

                const rootInodeData: string = [
                    "00000110", // Read ✅, Write ❌, Execute ❌
                    "0000000000000000", // Who owns this file? ROOT
                    "00000000000000000000000000000000", // How many bytes are in this file? FIXME
                    Date.now().toString(2).padStart(32, "0"), // What time was this file created?
                    Date.now().toString(2).padStart(32, "0"), // What time was this file last accessed?
                    Date.now().toString(2).padStart(32, "0"), // What time was this file last modified?
                    Date.now().toString(2).padStart(32, "0"), // What time was this inode deleted?
                    "00000001", // How many blocks have been allocated to this file?
                    [...Array(10)].map(() => "0".repeat(32)).join("") // initialize block pointers FIXME
                ].join("")

                await writeBlocks([0, 1, 2, 3], [superblockData, bitmap, bitmap, rootInodeData], (progress) => {
                    setProgress(progress)
                })
                
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

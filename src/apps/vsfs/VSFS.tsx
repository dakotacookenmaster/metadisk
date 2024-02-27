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
import { OpenFlags, Permissions, mkdir, writeBlocks } from "../../apis/vsfs"
import { getCharacterEncoding } from "./components/Viewers"
import { open } from "../../apis/vsfs"
import { setError } from "../../redux/reducers/appSlice"

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
                const magicNumber = superblock.magicNumber
                    .toString(2)
                    .padStart(8, "0") // 7 is the magic number indicating VSFS
                const inodeCount = superblock.numberOfInodes
                    .toString(2)
                    .padStart(16, "0") // the number of inodes in the system (need 16 bits to encode)
                const inodeBlocks = superblock.numberOfInodeBlocks
                    .toString(2)
                    .padStart(4, "0") // the number of blocks containing inodes
                const dataBlocks = superblock.numberOfDataBlocks
                    .toString(2)
                    .padStart(4, "0") // the number of datablocks in the system

                const writableBlockSize = blockSize
                    .toString(2)
                    .padStart(24, "0")
                const superblockData =
                    magicNumber +
                    inodeCount +
                    inodeBlocks +
                    dataBlocks +
                    writableBlockSize
                const bitmap = "1" + "0".repeat(sectorSize - 1)

                setProgress(0)
                setWaitingMessage({
                    title: "Formatting Disk",
                    message: "Please wait...",
                })

                const timestamp = Math.floor(Date.now() / 1000)
                    .toString(2)
                    .padStart(32, "0")

                const rootInodeData: string = [
                    "01010100", // Type: 📂, Read ✅, Write ✅, Execute ❌ ==> 1 byte
                    "000000000000000100000000", // How many bytes are in this file? FIXME ==> 32 bytes (for root directory)
                    timestamp, // What time was this file created? ==> 4 bytes
                    timestamp, // What time was this file last accessed? ==> 4 bytes
                    (3 + superblock.numberOfInodeBlocks)
                        .toString(2)
                        .padStart(4, "0") +
                        [...Array(7)].map(() => "0".repeat(4)).join(""), // initialize block pointers FIXME ==> 4 bytes
                ].join("")

                const rootDirectoryData: string = [
                    // . directory
                    "00000000".repeat(12), // 12 null characters
                    getCharacterEncoding(".").toString(2).padStart(8, "0"), // get . as ASCII
                    "00000000".repeat(3), // inode number

                    // .. directory
                    "00000000".repeat(11), // 11 null characters
                    getCharacterEncoding(".")
                        .toString(2)
                        .padStart(8, "0")
                        .repeat(2), // .. as ASCII
                    "00000000".repeat(3), // inode number
                ].join("")
                const rootDirectoryBlock = superblock.numberOfInodeBlocks + 3

                await writeBlocks(
                    [0, 1, 2, 3, rootDirectoryBlock],
                    [
                        superblockData,
                        bitmap,
                        bitmap,
                        rootInodeData,
                        rootDirectoryData,
                    ],
                    (progress) => {
                        setProgress(progress)
                    },
                )

                try {
                    setWaitingMessage({ title: "", message: "Creating some files..." })
                    await open(
                        "/file.txt",
                        [OpenFlags.O_CREAT, OpenFlags.O_RDONLY],
                        Permissions.Read,
                    )
                    await mkdir("/abc", Permissions.ReadWrite)
                    await mkdir("/abc/def", Permissions.ReadWrite)
                    await mkdir("/abc/def/ghi", Permissions.ReadWrite)
                    await mkdir("/abc/def/ghi/jkl", Permissions.ReadWrite)
                } catch (error) {
                    let e = error as Error
                    dispatch(
                        setError({
                            name: e.name,
                            message: e.message,
                        }),
                    )
                } finally {
                    setWaitingMessage(null)
                }

                dispatch(setIsDiskFormatted(true))

                await open("/dakota.txt", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.Read)
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

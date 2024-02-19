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
import { writeSector } from "../../apis/disk"

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
    const [formattingMessage] = useState("Writing Superblock...")
    const [waitingMessage] = useState<null | string>(null)
    const dispatch = useAppDispatch()

    const getBlockStartingSector = (block: number) => {
        return block * sectorsPerBlock
    }


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

                // write to the first block
                const superblockRequest = writeSector(
                    getBlockStartingSector(0),
                    superblockData,
                ) 

                // write the inode bitmap
                const inodeBitmapRequest = writeSector(
                    getBlockStartingSector(1),
                    bitmap,
                ) 

                // write the data bitmap
                const dataBitmapRequest = writeSector(
                    getBlockStartingSector(2),
                    bitmap,
                )
                
                await Promise.all([
                    superblockRequest,
                    inodeBitmapRequest,
                    dataBitmapRequest,
                ])

                dispatch(setIsDiskFormatted(true))
            })()
        }
    }, [isFinishedConfiguringFileSystem, isAwaitingDisk])

    return (
        <Paper
            sx={{
                padding: theme.spacing(2),
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
                !isDiskFormatted && (
                    <WaitingMessage
                        title="Formatting Disk"
                        message={formattingMessage}
                    />
                )}
            {isFinishedConfiguringFileSystem &&
                !isAwaitingDisk &&
                isDiskFormatted &&
                waitingMessage && (
                    <WaitingMessage
                        title="Please Wait"
                        message={waitingMessage}
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

import AlbumIcon from "@mui/icons-material/Album"
import { Box, Paper, Typography } from "@mui/material"
import { useEffect, useRef, useState } from "react"
import { useAppSelector } from "../../redux/hooks/hooks"
import {
    selectArmRotation,
    selectCurrentlyServicing,
    selectDiskState,
} from "../../redux/reducers/diskSlice"
import {
    selectIsAwaitingDisk,
    selectIsFinishedConfiguringFileSystem,
} from "../../redux/reducers/fileSystemSlice"
import SetUpDisk from "./components/SetUpDisk"
import WaitingMessage from "../common/components/WaitingMessage"
import DiskPlatter from "./components/DiskPlatter"
import DiskArm from "./components/DiskArm"
import DiskMetrics from "./components/DiskMetrics"

export const DiskSimulatorIcon = (props: any) => {
    return (
        <>
            <svg width={0} height={0}>
                <linearGradient id="linearColors" x1={0} y1={0} x2={1} y2={1}>
                    <stop offset={0} stopColor="rgba(33, 33, 33, 1)" />
                    <stop offset={1} stopColor="rgba(174, 190, 241, 1)" />
                    <stop offset={1} stopColor="rgba(255, 190, 241, 1)" />
                </linearGradient>
            </svg>
            <AlbumIcon
                {...props}
                sx={{
                    fill: "url(#linearColors)",
                    animation: "rotate 2s linear infinite forwards",
                }}
            />
        </>
    )
}

const DiskSimulator = () => {
    const currentlyServicing = useAppSelector(selectCurrentlyServicing)
    const dataRequests = useRef<string[]>([])
    const diskState = useAppSelector(selectDiskState)
    const isFinishedConfiguringFileSystem = useAppSelector(
        selectIsFinishedConfiguringFileSystem,
    )
    const isAwaitingDisk = useAppSelector(selectIsAwaitingDisk)
    const armRotation = useAppSelector(selectArmRotation)

    // useEffect(() => {
    //     const id = setInterval(() => {
    //         const newRotation = Math.random() * 50
    //         setArmRotation((prevRotation) => {
    //             const difference = Math.abs(newRotation - prevRotation.degrees)
    //             const newValue = {
    //                 degrees: newRotation,
    //                 time: (3 / 55) * difference,
    //             }
    //             return newValue
    //         })
    //     }, 3000)

    //     return () => {
    //         clearInterval(id)
    //     }
    // }, [])

    useEffect(() => {
        console.log("DISK STATE:", diskState)
    }, [diskState])

    useEffect(() => {
        if (currentlyServicing) {
            console.log(currentlyServicing)
            dataRequests.current.splice(
                dataRequests.current.findIndex(
                    (value) => value === currentlyServicing.requestId,
                ),
                1,
            )
        }
    }, [currentlyServicing])

    return (
        <Paper
            sx={{
                minHeight: "fit-content",
                height: "100%",
                padding: "10px 20px",
            }}
        >
            {!isFinishedConfiguringFileSystem && (
                <WaitingMessage
                    title="Set Up Your Disk"
                    message="Waiting for file system..."
                />
            )}
            {isFinishedConfiguringFileSystem && isAwaitingDisk && <SetUpDisk />}
            {isFinishedConfiguringFileSystem && !isAwaitingDisk && (
                <Box sx={{ minWidth: "500px" }}>
                    <Typography variant="h5" sx={{ textAlign: "center" }}>
                        Disk Simulator
                    </Typography>
                    <hr />
                    <Box
                        sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            marginTop: "15px",
                            paddingTop: "45px",
                        }}
                    >
                        <DiskMetrics />
                        <DiskPlatter />
                        <DiskArm rotation={armRotation} />
                    </Box>
                </Box>
            )}
        </Paper>
    )
}

export default DiskSimulator

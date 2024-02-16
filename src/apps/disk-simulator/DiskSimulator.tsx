import AlbumIcon from "@mui/icons-material/Album"
import {
    Paper,
    useTheme,
} from "@mui/material"
import { useEffect, useRef } from "react"
import { useAppSelector } from "../../redux/hooks/hooks"
import {
    selectCurrentlyServicing,
    selectDiskState,
} from "../../redux/reducers/diskSlice"
import {
    selectIsAwaitingDisk,
    selectIsFinishedConfiguringFileSystem,
} from "../../redux/reducers/fileSystemSlice"
import SetUpDisk from "./components/SetUpDisk"
import AwaitingFileSystemConfiguration from "./components/AwaitingFileSystemConfiguration";

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
    const theme = useTheme()

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
        <Paper sx={{ height: "100%", padding: theme.spacing(2) }}>
            {!isFinishedConfiguringFileSystem && (
                <AwaitingFileSystemConfiguration />
            )}
            {isFinishedConfiguringFileSystem && isAwaitingDisk && <SetUpDisk />}
        </Paper>
    )
}

export default DiskSimulator

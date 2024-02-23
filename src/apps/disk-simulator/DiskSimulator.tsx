import AlbumIcon from "@mui/icons-material/Album"
import { Box, Paper, Typography } from "@mui/material"
import { useAppSelector } from "../../redux/hooks/hooks"
import {
    selectArmRotation,
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
import DiskControls from "./components/DiskControls"

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
    const isFinishedConfiguringFileSystem = useAppSelector(
        selectIsFinishedConfiguringFileSystem,
    )
    const isAwaitingDisk = useAppSelector(selectIsAwaitingDisk)
    const armRotation = useAppSelector(selectArmRotation)

    return (
        <Paper
            sx={{
                minHeight: "fit-content",
                height: "100%",
                padding: "10px 20px",
                overflow: "hidden",
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
                        <DiskControls sx={{ 
                            position: "absolute",
                            top: 0, 
                            left: "80%",
                        }} />
                        <DiskPlatter />
                        <DiskArm rotation={armRotation} />
                    </Box>
                </Box>
            )}
        </Paper>
    )
}

export default DiskSimulator

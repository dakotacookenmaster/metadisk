import AlbumIcon from "@mui/icons-material/Album"
import { Box, Paper, Typography, useTheme } from "@mui/material"
import { useAppSelector } from "../../redux/hooks/hooks"
import {
    selectArmRotation,
    selectDiskQueue,
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
import { blue } from "@mui/material/colors"

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
    const diskQueue = useAppSelector(selectDiskQueue)
    const theme = useTheme()

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
                <Box
                    sx={{
                        minWidth: "500px",
                        minHeight: "700px",
                    }}
                >
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
                        <DiskControls
                            sx={{
                                position: "absolute",
                                top: 0,
                                right: "15px",
                            }}
                        />
                        <DiskPlatter />
                        <DiskArm rotation={armRotation} />
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            gap: "5px",
                            alignItems: "center",
                            overflowX: "scroll",
                            scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                            scrollbarWidth: "thin",
                            paddingBottom: "20px",
                        }}
                    >
                        <Typography sx={{ marginRight: "5px", minWidth: "90px" }}>
                            Disk Queue:{" "}
                        </Typography>
                        {diskQueue.map((item, index) => {
                            return (
                                <Box
                                    key={`queue-${index}`}
                                    sx={{
                                        border: "2px solid white",
                                        borderRadius: "10px",
                                        minWidth: "60px",
                                        height: "60px",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    {item.sectorNumber} ({item.type.slice(0, 1).toUpperCase()})
                                </Box>
                            )
                        })}
                        {diskQueue.length === 0 && (
                            <Box
                                sx={{
                                    border: "2px solid white",
                                    borderRadius: "10px",
                                    minWidth: "60px",
                                    height: "60px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                N/A
                            </Box>
                        )}
                    </Box>
                </Box>
            )}
        </Paper>
    )
}

export default DiskSimulator

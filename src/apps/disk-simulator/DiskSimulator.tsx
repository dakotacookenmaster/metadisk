import AlbumIcon from "@mui/icons-material/Album"
import { Box, Paper, Tab, Tabs, Typography, useTheme } from "@mui/material"
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks"
import {
    selectArmRotation,
    selectDiskQueue,
    selectViewMode,
    setViewMode,
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
import DiskScene3D from "./components/DiskScene3D"
import { blue } from "@mui/material/colors"
import { getAppIcon, getAppName } from "../../register-apps"
import Tooltip from "../common/components/Tooltip"

export const DiskSimulatorIcon = (props: object) => {
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
    const viewMode = useAppSelector(selectViewMode)
    const dispatch = useAppDispatch()
    const theme = useTheme()

    /**
     * Group consecutive queue entries that belong to the same higher-level
     * operation (i.e. share an `opId` stamped on their payload by
     * `readBlock` / `writeBlock`). Each group is rendered as a row of
     * sector boxes with a single bracket and the originating app's icon
     * underneath, so users can see at a glance which app is responsible
     * for each pending block I/O.
     *
     * Why group by `opId` rather than `(block, appId)` with a sectors-per-
     * block cap? Because the disk dequeues from the front of the queue
     * one sector at a time. With a cap-based scheme, after a few dequeues
     * sectors from a *later* operation slide forward into the previous
     * group's free slots — visually causing groups in the middle/right of
     * the queue to "disappear" before the leftmost ones drain. Grouping
     * by an explicit operation id is immune to that, because the boundary
     * is set at the producing call site (the `readBlock` / `writeBlock`
     * call), not inferred from queue contents.
     *
     * Loose sector requests (no `opId`) get their own single-item groups
     * keyed by `requestId`, since they don't belong to any block-level op.
     */
    type QueueGroup = {
        opId: string
        appId: string | undefined
        items: typeof diskQueue
    }
    const groups: QueueGroup[] = []
    for (const item of diskQueue) {
        const groupKey = item.opId ?? item.requestId
        const last = groups[groups.length - 1]
        if (last !== undefined && last.opId === groupKey) {
            last.items.push(item)
        } else {
            groups.push({ opId: groupKey, appId: item.appId, items: [item] })
        }
    }

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
                        minHeight: "690px",
                    }}
                >
                    <Typography variant="h5" sx={{ textAlign: "center", marginTop: "10px" }}>
                        Disk Simulator
                    </Typography>
                    <Tabs
                        value={viewMode}
                        onChange={(_, v) => dispatch(setViewMode(v))}
                        centered
                        sx={{ minHeight: "36px", "& .MuiTab-root": { minHeight: "36px", paddingY: "4px" } }}
                    >
                        <Tab value="2d" label="2D" />
                        <Tab value="3d" label="3D" />
                    </Tabs>
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
                        {viewMode === "2d" ? (
                            <>
                                <DiskPlatter />
                                <DiskArm rotation={armRotation} />
                            </>
                        ) : (
                            <DiskScene3D />
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            gap: "5px",
                            alignItems: "flex-start",
                            overflowX: "auto",
                            scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                            scrollbarWidth: "thin",
                            paddingBottom: "10px",
                            marginTop: "-30px",
                        }}
                    >
                        <Typography sx={{ marginRight: "5px", minWidth: "90px", marginTop: "12px" }}>
                            Disk Queue:{" "}
                        </Typography>
                        {groups.map((group, groupIndex) => {
                            const Icon = getAppIcon(group.appId)
                            const tooltipLabel = getAppName(group.appId)
                            return (
                                <Box
                                    key={`group-${groupIndex}`}
                                    data-testid={`queue-group-${groupIndex}`}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: "5px",
                                        }}
                                    >
                                        {group.items.map((item, index) => (
                                            <Box
                                                key={`queue-${groupIndex}-${index}`}
                                                sx={{
                                                    border: "2px solid white",
                                                    borderRadius: "10px",
                                                    minWidth: "60px",
                                                    height: "50px",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                {item.sectorNumber} ({item.type.slice(0, 1).toUpperCase()})
                                            </Box>
                                        ))}
                                    </Box>
                                    {/*
                                       Bracket + originating app icon
                                       underneath the group. The bracket is
                                       drawn with three borders (left/right/
                                       bottom) so it visually unites the
                                       boxes above it like  |________|  .
                                    */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            marginTop: "4px",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: "100%",
                                                height: "8px",
                                                borderLeft: "2px solid white",
                                                borderRight: "2px solid white",
                                                borderBottom: "2px solid white",
                                                borderBottomLeftRadius: "4px",
                                                borderBottomRightRadius: "4px",
                                            }}
                                        />
                                        <Tooltip
                                            placement="bottom"
                                            title={`Queued by: ${tooltipLabel}`}
                                        >
                                            <Box
                                                data-testid={`queue-group-icon-${groupIndex}`}
                                                sx={{
                                                    marginTop: "2px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Icon sx={{ fontSize: "20px" }} />
                                            </Box>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            )
                        })}
                        {diskQueue.length === 0 && (
                            <Box
                                sx={{
                                    border: "2px solid white",
                                    borderRadius: "10px",
                                    minWidth: "60px",
                                    height: "50px",
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

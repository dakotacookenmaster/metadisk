import { Box, Typography } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { DiskStateType, selectDiskQueue, selectDiskState } from "../../../redux/reducers/diskSlice"
import SaveAsIcon from "@mui/icons-material/SaveAs"
import SearchIcon from "@mui/icons-material/Search"
import HourglassTopIcon from "@mui/icons-material/HourglassTop"
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement"
import AutoStoriesIcon from "@mui/icons-material/AutoStories"
import Tooltip from "../../common/components/Tooltip"

const DiskMetrics = () => {
    const diskState = useAppSelector(selectDiskState)
    const diskQueue = useAppSelector(selectDiskQueue)
    const getStateData = (state: DiskStateType) => {
        switch(state) {
            case "idle":
                return {
                    name: "Disk Idling",
                    icon: SelfImprovementIcon
                }
            case "seek":
                return {
                    name: "Disk Seek",
                    icon: SearchIcon,
                }
            case "read": 
                return {
                    name: "Disk Read",
                    icon: AutoStoriesIcon
                }
            case "write": 
                return {
                    name: "Disk Write",
                    icon: SaveAsIcon,
                }
            case "waiting":
                return {
                    name: "Disk Waiting",
                    icon: HourglassTopIcon
                }
        } 
    }

    const layoutData = getStateData(diskState)
    const Component = layoutData.icon
    return (
        <Box sx={{ position: "absolute", zIndex: 50, top: 0, left: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Tooltip placement="right" title={layoutData.name}>
                <Component sx={{ fontSize: "50px" }} />
            </Tooltip>
            <Typography variant="overline" sx={{ fontWeight: "bold" }}>{ diskState } &#40;{diskQueue[0]?.sectorNumber}&#41;</Typography>
        </Box>
    )
}

export default DiskMetrics

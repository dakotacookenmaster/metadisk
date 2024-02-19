import { Box } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectDiskState } from "../../../redux/reducers/diskSlice"
import SaveAsIcon from "@mui/icons-material/SaveAs"
import SearchIcon from "@mui/icons-material/Search"
import HourglassTopIcon from "@mui/icons-material/HourglassTop"
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement"
import AutoStoriesIcon from "@mui/icons-material/AutoStories"
import Tooltip from "../../common/components/Tooltip"

const DiskMetrics = () => {
    const diskState = useAppSelector(selectDiskState)
    return (
        <Box sx={{ position: "absolute", zIndex: 50, top: 0, left: 0 }}>
            {diskState === "write" && (
                <Tooltip placement="right" title="Disk Write">
                    <SaveAsIcon sx={{ fontSize: "50px" }} />
                </Tooltip>
            )}
            {diskState === "seek" && (
                <Tooltip placement="right" title="Disk Seek">
                    <SearchIcon sx={{ fontSize: "50px" }} />
                </Tooltip>
            )}
            {diskState === "read" && (
                <Tooltip placement="right" title="Disk Read">
                    <AutoStoriesIcon sx={{ fontSize: "50px" }} />
                </Tooltip>
            )}
            {diskState === "idle" && (
                <Tooltip placement="right" title="Disk Idling">
                    <SelfImprovementIcon sx={{ fontSize: "50px" }} />
                </Tooltip>
            )}
            {diskState === "waiting" && (
                <Tooltip placement="right" title="Disk Waiting">
                    <HourglassTopIcon sx={{ fontSize: "50px" }} />
                </Tooltip>
            )}
        </Box>
    )
}

export default DiskMetrics

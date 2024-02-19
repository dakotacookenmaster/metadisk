import { Box } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectDiskState } from "../../../redux/reducers/diskSlice"
import SaveAsIcon from "@mui/icons-material/SaveAs"
import SearchIcon from "@mui/icons-material/Search"
import HourglassTopIcon from "@mui/icons-material/HourglassTop"
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement"
import AutoStoriesIcon from "@mui/icons-material/AutoStories"

const DiskMetrics = () => {
    const diskState = useAppSelector(selectDiskState)
    return (
        <Box sx={{ position: "absolute", zIndex: 50, top: 0, left: 0 }}>
            {diskState === "write" && <SaveAsIcon sx={{ fontSize: "50px" }} />}
            {diskState === "seek" && <SearchIcon sx={{ fontSize: "50px" }} />}
            {diskState === "read" && (
                <AutoStoriesIcon sx={{ fontSize: "50px" }} />
            )}
            {diskState === "idle" && (
                <SelfImprovementIcon sx={{ fontSize: "50px" }} />
            )}
            {diskState === "waiting" && (
                <HourglassTopIcon sx={{ fontSize: "50px" }} />
            )}
        </Box>
    )
}

export default DiskMetrics

import { Box, Typography } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectDisk, selectDiskState } from "../../../redux/reducers/diskSlice"
import SaveAsIcon from "@mui/icons-material/SaveAs"
import SearchIcon from "@mui/icons-material/Search"
import StopCircleIcon from "@mui/icons-material/StopCircle"

const DiskMetrics = () => {
    const diskState = useAppSelector(selectDiskState)
    const disk = useAppSelector(selectDisk)
    return (
        <Box sx={{ position: "absolute", zIndex: 50, top: 0, left: 0 }}>
            {diskState === "write" && <SaveAsIcon fontSize="large" />}
            {diskState === "seek" && <SearchIcon fontSize="large" />}
            {diskState === "idle" && <StopCircleIcon fontSize="large" />}
            <Typography>{diskState}: { disk.queue[0]?.sectorNumber }</Typography>
        </Box>
    )
}

export default DiskMetrics

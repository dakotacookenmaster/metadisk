import { Box, Typography } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectDiskState } from "../../../redux/reducers/diskSlice"
import SaveAsIcon from '@mui/icons-material/SaveAs';

const DiskMetrics = () => {
    const diskState = useAppSelector(selectDiskState)
    return (
        <Box sx={{ position: "absolute", zIndex: 50, top: 0, left: 0 }}>
            { diskState === "write" && (
                <SaveAsIcon />
            )}
            <Typography>{ diskState }</Typography>
        </Box>
    )
}

export default DiskMetrics
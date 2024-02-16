import { Box, Typography, useTheme } from "@mui/material"
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"

const AwaitingFileSystemConfiguration = () => {
    const theme = useTheme()
    return (
        <>
            <Typography
                variant="h5"
                sx={{ textAlign: "center", paddingBottom: "3px" }}
            >
                Disk Configuration
            </Typography>
            <hr />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing(2),
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "calc(100% - 50px)",
                }}
            >
                <HourglassEmptyIcon
                    sx={{ fontSize: "50px" }}
                    className="slowBounceAndWobble"
                />
                <Typography variant="body1" fontSize="20px">
                    Please Configure Your File System Before Continuing
                </Typography>
            </Box>
        </>
    )
}

export default AwaitingFileSystemConfiguration

import { Box, Typography, useTheme } from "@mui/material"
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"

const WaitingMessage = (props: {
    title?: string
    message: string
}) => {
    const theme = useTheme()
    const { title, message } = props
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                minHeight: "400px",
            }}
        >
            {title && (
                <Typography
                    variant="h5"
                    sx={{ textAlign: "center", paddingBottom: theme.spacing(2) }}
                >
                    {title}
                </Typography>
            )}
            <HourglassEmptyIcon
                sx={{ fontSize: "50px" }}
                className="slowBounceAndWobble"
            />
            <Typography 
                variant="body1" 
                fontSize="20px" 
                sx={{ textAlign: "center", marginTop: theme.spacing(2) }}
            >
                {message}
            </Typography>
        </Box>
    )
}

export default WaitingMessage

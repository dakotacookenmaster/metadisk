import { Box, Typography, useTheme } from "@mui/material"
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"

const WaitingMessage = (props: { title: string, message: string }) => {
    const theme = useTheme()
    const { title, message } = props
    return (
        <>
            <Typography
                variant="h5"
                sx={{ textAlign: "center", paddingBottom: "3px" }}
            >
                { title }
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
                    p: 2,
                }}
            >
                <HourglassEmptyIcon
                    sx={{ fontSize: "50px" }}
                    className="slowBounceAndWobble"
                />
                <Typography variant="body1" fontSize="20px">
                    { message }
                </Typography>
            </Box>
        </>
    )
}

export default WaitingMessage

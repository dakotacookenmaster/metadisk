import { Box, CircularProgress, Typography, useTheme } from "@mui/material"
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty"

const WaitingMessage = (props: {
    title?: string
    message: string
    progress?: number
}) => {
    const theme = useTheme()
    const { title, message, progress } = props
    return (
        <>
            {title && (
                <>
                    <Typography
                        variant="h5"
                        sx={{ textAlign: "center", paddingBottom: "3px", paddingTop: "10px" }}
                    >
                        {title}
                    </Typography>
                </>
            )}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing(2),
                    justifyContent: "center",
                    marginTop: title ? undefined : "40px",
                    alignItems: "center",
                    width: "100%",
                    height: "calc(100% - 180px)",
                    p: 2,
                }}
            >
                <HourglassEmptyIcon
                    sx={{ fontSize: "50px" }}
                    className="slowBounceAndWobble"
                />
                <Typography variant="body1" fontSize="20px" sx={{ textAlign: "center" }}>
                    {message}
                </Typography>
                {progress !== undefined && (
                    <Box sx={{ position: "relative", display: "inline-flex" }}>
                        <CircularProgress
                            size="80px"
                            variant="determinate"
                            value={progress}
                            sx={{ position: "relative", zIndex: 3 }}
                        />
                        <CircularProgress
                            size="80px"
                            sx={{
                                color: "gray",
                                position: "absolute",
                                zIndex: 0,
                            }}
                            variant="determinate"
                            value={100}
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Typography
                                variant="caption"
                                component="div"
                                color="text.secondary"
                                fontSize="25px"
                            >{`${progress.toFixed(0)}%`}</Typography>
                        </Box>
                    </Box>
                )}
            </Box>
        </>
    )
}

export default WaitingMessage

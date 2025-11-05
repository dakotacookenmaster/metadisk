import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    useTheme,
    Paper,
} from "@mui/material"
import { useEffect, useState } from "react"
import { getCacheStats } from "../../apis/vsfs/system/BlockCache.vsfs"
import { blue, green, orange } from "@mui/material/colors"

interface CacheStats {
    hits: number
    misses: number
    hitRate: number
    size: number
    maxSize: number
}

export default function CacheStatistics() {
    const theme = useTheme()
    const [stats, setStats] = useState<CacheStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const updateStats = () => {
            const currentStats = getCacheStats()
            setStats(currentStats)
            setLoading(false)
        }

        // Update stats immediately
        updateStats()

        // Update stats every second
        const interval = setInterval(updateStats, 1000)

        return () => clearInterval(interval)
    }, [])

    if (loading || !stats) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "400px",
                }}
            >
                <Typography variant="h6">Loading cache statistics...</Typography>
            </Box>
        )
    }

    const cacheUtilization = (stats.size / stats.maxSize) * 100

    return (
        <Paper
            sx={{
                pt: theme.spacing(1.3),
                pb: theme.spacing(2),
                px: theme.spacing(2),
                height: "100%",
                flexGrow: 1,
                flexBasis: "50%",
            }}
        >
            <Box sx={{ padding: theme.spacing(2) }}>
                <Typography
                    variant="h5"
                    sx={{
                        textAlign: "center",
                        marginBottom: theme.spacing(3),
                        fontWeight: "bold",
                    }}
                >
                    Block Cache Statistics
                </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: theme.spacing(3),
                    marginBottom: theme.spacing(3),
                }}
            >
                {/* Cache Size */}
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            sx={{ marginBottom: theme.spacing(2) }}
                        >
                            Cache Size
                        </Typography>
                        <Typography variant="h4" sx={{ color: blue[600] }}>
                            {stats.size} / {stats.maxSize}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            blocks cached
                        </Typography>
                        <Box sx={{ marginTop: theme.spacing(2) }}>
                            <LinearProgress
                                variant="determinate"
                                value={cacheUtilization}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: theme.palette.grey[300],
                                    "& .MuiLinearProgress-bar": {
                                        backgroundColor:
                                            cacheUtilization > 80
                                                ? orange[500]
                                                : green[500],
                                    },
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{ marginTop: theme.spacing(1) }}
                            >
                                {cacheUtilization.toFixed(1)}% utilized
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* Hit Rate */}
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            sx={{ marginBottom: theme.spacing(2) }}
                        >
                            Cache Performance
                        </Typography>
                        <Typography variant="h4" sx={{ color: green[600] }}>
                            {stats.hitRate.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            hit rate
                        </Typography>
                        <Box sx={{ marginTop: theme.spacing(2) }}>
                            <Typography variant="body2">
                                Hits: {stats.hits.toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                                Misses: {stats.misses.toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                                Total Accesses: {(stats.hits + stats.misses).toLocaleString()}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Detailed Statistics */}
            <Paper
                sx={{
                    padding: theme.spacing(3),
                    backgroundColor: theme.palette.grey[900],
                    marginTop: theme.spacing(2),
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        marginBottom: theme.spacing(3),
                        fontWeight: "bold",
                        textAlign: "center",
                        color: theme.palette.common.white,
                    }}
                >
                    Detailed Statistics
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "1fr 1fr",
                            md: "1fr 1fr 1fr 1fr"
                        },
                        gap: theme.spacing(3),
                    }}
                >
                    <Box
                        sx={{
                            textAlign: "center",
                            padding: theme.spacing(2),
                            borderRadius: 2,
                            backgroundColor: theme.palette.grey[800],
                            border: `1px solid ${theme.palette.grey[700]}`,
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                color: green[600],
                                fontWeight: "bold",
                                marginBottom: theme.spacing(1)
                            }}
                        >
                            {stats.hits.toLocaleString()}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ 
                                fontWeight: 500,
                                color: theme.palette.grey[300]
                            }}
                        >
                            Cache Hits
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            textAlign: "center",
                            padding: theme.spacing(2),
                            borderRadius: 2,
                            backgroundColor: theme.palette.grey[800],
                            border: `1px solid ${theme.palette.grey[700]}`,
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                color: orange[600],
                                fontWeight: "bold",
                                marginBottom: theme.spacing(1)
                            }}
                        >
                            {stats.misses.toLocaleString()}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ 
                                fontWeight: 500,
                                color: theme.palette.grey[300]
                            }}
                        >
                            Cache Misses
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            textAlign: "center",
                            padding: theme.spacing(2),
                            borderRadius: 2,
                            backgroundColor: theme.palette.grey[800],
                            border: `1px solid ${theme.palette.grey[700]}`,
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                color: blue[600],
                                fontWeight: "bold",
                                marginBottom: theme.spacing(1)
                            }}
                        >
                            {stats.size.toLocaleString()}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ 
                                fontWeight: 500,
                                color: theme.palette.grey[300]
                            }}
                        >
                            Blocks Cached
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            textAlign: "center",
                            padding: theme.spacing(2),
                            borderRadius: 2,
                            backgroundColor: theme.palette.grey[800],
                            border: `1px solid ${theme.palette.grey[700]}`,
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                color: theme.palette.primary.main,
                                fontWeight: "bold",
                                marginBottom: theme.spacing(1)
                            }}
                        >
                            {stats.maxSize.toLocaleString()}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ 
                                fontWeight: 500,
                                color: theme.palette.grey[300]
                            }}
                        >
                            Max Cache Size
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
        </Paper>
    )
}
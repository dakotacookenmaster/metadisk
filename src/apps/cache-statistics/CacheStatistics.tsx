import {
    Box,
    LinearProgress,
    Paper,
    Typography,
    useTheme,
} from "@mui/material"
import { useEffect, useState } from "react"
import { getCacheStats } from "../../apis/vsfs/system/BlockCache.vsfs"
import { green, orange, red } from "@mui/material/colors"

interface CacheStats {
    hits: number
    misses: number
    hitRate: number
    size: number
    maxSize: number
}

const StatTile = ({
    label,
    value,
    color,
}: {
    label: string
    value: string | number
    color: string
}) => {
    const theme = useTheme()
    return (
        <Box
            sx={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                padding: theme.spacing(2),
                borderRadius: 1,
                background: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Typography
                variant="h4"
                sx={{ color, fontWeight: "bold", lineHeight: 1.1 }}
            >
                {value}
            </Typography>
            <Typography
                variant="overline"
                sx={{
                    color: theme.palette.text.secondary,
                    letterSpacing: 1,
                }}
            >
                {label}
            </Typography>
        </Box>
    )
}

export default function CacheStatistics() {
    const theme = useTheme()
    const [stats, setStats] = useState<CacheStats | null>(null)

    useEffect(() => {
        const update = () => setStats(getCacheStats())
        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [])

    if (!stats) {
        return (
            <Paper
                sx={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "10px 20px",
                }}
            >
                <Typography variant="h6">
                    Loading cache statistics...
                </Typography>
            </Paper>
        )
    }

    const cacheUtilization = (stats.size / stats.maxSize) * 100
    const total = stats.hits + stats.misses
    const utilizationColor =
        cacheUtilization > 90
            ? red[500]
            : cacheUtilization > 75
            ? orange[500]
            : green[500]

    return (
        <Paper
            sx={{
                height: "100%",
                padding: "10px 20px",
                overflow: "hidden",
            }}
        >
            <Typography
                variant="h5"
                sx={{ textAlign: "center", marginTop: "10px" }}
            >
                Block Cache Statistics
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing(3),
                    marginTop: theme.spacing(3),
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: theme.spacing(3),
                        padding: theme.spacing(3),
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.background.default,
                    }}
                >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                            variant="overline"
                            sx={{
                                color: theme.palette.text.secondary,
                                letterSpacing: 1,
                            }}
                        >
                            Hit Rate
                        </Typography>
                        <Typography
                            variant="h3"
                            sx={{
                                color: theme.palette.primary.main,
                                fontWeight: "bold",
                                lineHeight: 1,
                            }}
                        >
                            {stats.hitRate.toFixed(1)}%
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: theme.palette.text.secondary,
                                marginTop: theme.spacing(0.5),
                            }}
                        >
                            {stats.hits.toLocaleString()} hits /{" "}
                            {total.toLocaleString()} accesses
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: theme.spacing(1),
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <Typography variant="body2">
                                Cache Utilization
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: "bold" }}
                            >
                                {cacheUtilization.toFixed(1)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={cacheUtilization}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: theme.palette.action.hover,
                                "& .MuiLinearProgress-bar": {
                                    backgroundColor: utilizationColor,
                                    borderRadius: 5,
                                },
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.secondary }}
                        >
                            {stats.size} / {stats.maxSize} blocks cached
                        </Typography>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        gap: theme.spacing(2),
                        flexWrap: "wrap",
                    }}
                >
                    <StatTile
                        label="Cache Hits"
                        value={stats.hits.toLocaleString()}
                        color={green[400]}
                    />
                    <StatTile
                        label="Cache Misses"
                        value={stats.misses.toLocaleString()}
                        color={orange[400]}
                    />
                    <StatTile
                        label="Blocks Cached"
                        value={stats.size.toLocaleString()}
                        color={theme.palette.primary.main}
                    />
                    <StatTile
                        label="Max Cache Size"
                        value={stats.maxSize.toLocaleString()}
                        color={theme.palette.text.primary}
                    />
                </Box>
            </Box>
        </Paper>
    )
}
import {
    Box,
    Button,
    LinearProgress,
    Paper,
    Stack,
    Typography,
    useTheme,
} from "@mui/material"
import { blockCache } from "../../apis/vsfs/system/BlockCache.vsfs"
import {
    blue,
    green,
    grey,
    orange,
    purple,
    red,
} from "@mui/material/colors"
import Tooltip from "../common/components/Tooltip"
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks"
import {
    selectCacheEnabled,
    selectCacheStats,
    setCacheEnabled,
} from "../../redux/reducers/diskSlice"
import EditNoteIcon from "@mui/icons-material/EditNote"
import RecyclingIcon from "@mui/icons-material/Recycling"
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew"
import type { SvgIconComponent } from "@mui/icons-material"

interface CacheStats {
    hits: number
    misses: number
    hitRate: number
    size: number
    maxSize: number
    writePolicy: string
    replacementPolicy: string
}
const WRITE_POLICY_DESCRIPTIONS: Record<string, string> = {
    "write-through":
        "Writes go to both the cache and the disk simultaneously. The cache always reflects the latest data.",
    "write-back":
        "Writes go only to the cache and are flushed to the disk later. Faster, but data can be lost if the cache is cleared before a flush.",
    "write-around":
        "Writes bypass the cache and go straight to the disk. The cached entry for that block is invalidated so the next read pulls fresh data.",
}

const REPLACEMENT_POLICY_DESCRIPTIONS: Record<string, string> = {
    LRU: "Least Recently Used \u2014 evicts the block that has not been accessed for the longest time.",
    LFU: "Least Frequently Used \u2014 evicts the block with the fewest accesses.",
    FIFO: "First In, First Out \u2014 evicts the block that was loaded into the cache earliest.",
    Random: "Evicts a randomly selected block.",
}

const SECTION_TITLE_SX = {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    color: grey[500],
}

const StatCard = ({
    label,
    value,
    accent,
}: {
    label: string
    value: string | number
    accent: string
}) => {
    const theme = useTheme()
    return (
        <Box
            sx={{
                flex: "1 1 0",
                minWidth: 0,
                padding: theme.spacing(2),
                borderRadius: theme.spacing(1),
                background: theme.palette.background.default,
                border: `1px solid ${theme.palette.divider}`,
                borderTop: `3px solid ${accent}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: theme.spacing(0.5),
            }}
        >
            <Typography sx={SECTION_TITLE_SX}>{label}</Typography>
            <Typography
                sx={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: accent,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </Typography>
        </Box>
    )
}

const PolicyCard = ({
    label,
    value,
    description,
    icon: Icon,
    accent,
}: {
    label: string
    value: string
    description: string
    icon: SvgIconComponent
    accent: string
}) => {
    const theme = useTheme()
    return (
        <Tooltip placement="top" title={description}>
            <Box
                sx={{
                    flex: "1 1 0",
                    minWidth: 0,
                    padding: theme.spacing(2),
                    borderRadius: theme.spacing(1),
                    background: theme.palette.background.default,
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: `4px solid ${accent}`,
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing(1.5),
                    cursor: "help",
                }}
            >
                <Icon sx={{ color: accent, fontSize: 28 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={SECTION_TITLE_SX}>{label}</Typography>
                    <Typography
                        sx={{
                            fontSize: "1.05rem",
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            textTransform: "capitalize",
                            lineHeight: 1.2,
                        }}
                    >
                        {value}
                    </Typography>
                </Box>
            </Box>
        </Tooltip>
    )
}

export default function CacheStatistics() {
    const theme = useTheme()
    const cacheEnabled = useAppSelector(selectCacheEnabled)
    const counters = useAppSelector(selectCacheStats)
    const dispatch = useAppDispatch()

    const total = counters.hits + counters.misses
    const stats: CacheStats = {
        hits: counters.hits,
        misses: counters.misses,
        size: counters.size,
        maxSize: counters.maxSize,
        hitRate: total > 0 ? (counters.hits / total) * 100 : 0,
        writePolicy: blockCache.writePolicy,
        replacementPolicy: blockCache.replacementPolicy,
    }

    if (!cacheEnabled) {
        return (
            <Paper
                sx={{
                    height: "100%",
                    padding: theme.spacing(3),
                    display: "flex",
                    flexDirection: "column",
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
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: theme.spacing(2),
                    }}
                >
                    <PowerSettingsNewIcon
                        sx={{ fontSize: 64, color: grey[600] }}
                    />
                    <Typography
                        sx={{
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                        }}
                    >
                        Cache Disabled
                    </Typography>
                    <Typography
                        sx={{
                            color: theme.palette.text.secondary,
                            textAlign: "center",
                            maxWidth: "440px",
                            lineHeight: 1.5,
                        }}
                    >
                        All reads and writes are going directly to the disk.
                        Re-enabling will start with a freshly cleared cache.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<PowerSettingsNewIcon />}
                        onClick={() => dispatch(setCacheEnabled(true))}
                        sx={{ marginTop: theme.spacing(1) }}
                    >
                        Enable Cache
                    </Button>
                </Box>
            </Paper>
        )
    }

    const cacheUtilization = (stats.size / stats.maxSize) * 100
    const utilizationColor =
        cacheUtilization > 90
            ? red[500]
            : cacheUtilization > 75
            ? orange[500]
            : green[500]
    const hitRateColor =
        stats.hitRate >= 75
            ? green[400]
            : stats.hitRate >= 40
            ? orange[400]
            : total === 0
            ? grey[500]
            : red[400]

    return (
        <Paper
            sx={{
                height: "100%",
                padding: theme.spacing(3),
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(2.5),
                overflow: "auto",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    marginTop: "10px",
                    gap: theme.spacing(1),
                }}
            >
                <Box />
                <Typography variant="h5" sx={{ textAlign: "center" }}>
                    Block Cache Statistics
                </Typography>
                <Box sx={{ justifySelf: "end" }}>
                    <Tooltip
                        placement="left"
                        title="Disable the block cache. Toggling will completely clear the cache."
                    >
                        <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            startIcon={<PowerSettingsNewIcon />}
                            onClick={() =>
                                dispatch(setCacheEnabled(false))
                            }
                            aria-label="Disable Cache"
                        >
                            Disable
                        </Button>
                    </Tooltip>
                </Box>
            </Box>

            {/* Hero: Hit Rate + Utilization */}
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: theme.spacing(2),
                    padding: theme.spacing(3),
                    borderRadius: theme.spacing(1),
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.background.default,
                }}
            >
                <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
                    <Typography sx={SECTION_TITLE_SX}>Hit Rate</Typography>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: theme.spacing(1),
                            marginTop: theme.spacing(0.5),
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: "3rem",
                                fontWeight: 800,
                                lineHeight: 1,
                                color: hitRateColor,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {stats.hitRate.toFixed(1)}
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "1.5rem",
                                fontWeight: 600,
                                color: hitRateColor,
                            }}
                        >
                            %
                        </Typography>
                    </Box>
                    <Typography
                        sx={{
                            color: theme.palette.text.secondary,
                            fontSize: "0.875rem",
                            marginTop: theme.spacing(1),
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {stats.hits.toLocaleString()} hits ·{" "}
                        {stats.misses.toLocaleString()} misses ·{" "}
                        {total.toLocaleString()} total
                    </Typography>
                </Box>

                <Box
                    sx={{
                        flex: "1 1 240px",
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.spacing(1),
                        justifyContent: "center",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                        }}
                    >
                        <Typography sx={SECTION_TITLE_SX}>
                            Utilization
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: "0.875rem",
                                fontWeight: 700,
                                color: utilizationColor,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {cacheUtilization.toFixed(1)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={cacheUtilization}
                        sx={{
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: theme.palette.action.hover,
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: utilizationColor,
                                borderRadius: 6,
                            },
                        }}
                    />
                    <Typography
                        sx={{
                            fontSize: "0.8rem",
                            color: theme.palette.text.secondary,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {stats.size.toLocaleString()} of{" "}
                        {stats.maxSize.toLocaleString()} blocks cached
                    </Typography>
                </Box>
            </Box>

            {/* Policies */}
            <Stack spacing={1}>
                <Typography sx={SECTION_TITLE_SX}>Policies</Typography>
                <Box
                    sx={{
                        display: "flex",
                        gap: theme.spacing(2),
                        flexWrap: "wrap",
                    }}
                >
                    <PolicyCard
                        label="Write Policy"
                        value={stats.writePolicy}
                        description={
                            WRITE_POLICY_DESCRIPTIONS[stats.writePolicy] ??
                            "Write policy used by this cache."
                        }
                        icon={EditNoteIcon}
                        accent={blue[400]}
                    />
                    <PolicyCard
                        label="Replacement Policy"
                        value={stats.replacementPolicy}
                        description={
                            REPLACEMENT_POLICY_DESCRIPTIONS[
                                stats.replacementPolicy
                            ] ??
                            "Replacement policy used to evict entries when the cache is full."
                        }
                        icon={RecyclingIcon}
                        accent={purple[400]}
                    />
                </Box>
            </Stack>

            {/* Counters */}
            <Stack spacing={1}>
                <Typography sx={SECTION_TITLE_SX}>Counters</Typography>
                <Box
                    sx={{
                        display: "flex",
                        gap: theme.spacing(2),
                        flexWrap: "wrap",
                    }}
                >
                    <StatCard
                        label="Hits"
                        value={stats.hits.toLocaleString()}
                        accent={green[400]}
                    />
                    <StatCard
                        label="Misses"
                        value={stats.misses.toLocaleString()}
                        accent={orange[400]}
                    />
                    <StatCard
                        label="Cached"
                        value={stats.size.toLocaleString()}
                        accent={blue[400]}
                    />
                    <StatCard
                        label="Capacity"
                        value={stats.maxSize.toLocaleString()}
                        accent={grey[400]}
                    />
                </Box>
            </Stack>
        </Paper>
    )
}
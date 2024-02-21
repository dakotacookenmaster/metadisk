import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    useTheme,
} from "@mui/material"
import Tooltip from "../../common/components/Tooltip"
import { useAppDispatch, useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectMinimumRequiredDiskSize,
    selectSectorSize,
    selectSectorsPerBlock,
    selectTotalBlocks,
    setIsAwaitingDisk,
} from "../../../redux/reducers/fileSystemSlice"
import {
    selectTrackCount,
    setSectors,
    setTrackCount,
} from "../../../redux/reducers/diskSlice"

const getByteCount = (amount: number) => {
    const GiB = amount / 8_589_934_592
    const MiB = amount / 8_388_608
    const KiB = amount / 8_192
    const B = amount / 8
    if (GiB >= 1) {
        return GiB === 1
            ? `${GiB.toLocaleString()} gibibyte (GiB)`
            : `${GiB.toLocaleString()} gibibytes (GiB)`
    } else if (MiB >= 1) {
        return MiB === 1
            ? `${MiB.toLocaleString()} mebibyte (MiB)`
            : `${MiB.toLocaleString()} mebibytes (MiB)`
    } else if (KiB >= 1) {
        return KiB === 1
            ? `${KiB.toLocaleString()} kibibyte (KiB)`
            : `${KiB.toLocaleString()} kibibytes (KiB)`
    } else {
        return `${B.toLocaleString()} bytes (B)`
    }
}

const SetUpDisk = () => {
    const theme = useTheme()
    const sectorSize = useAppSelector(selectSectorSize)
    const trackCount = useAppSelector(selectTrackCount)
    const diskSize = useAppSelector(selectMinimumRequiredDiskSize)
    const totalSectors =
        useAppSelector(selectSectorsPerBlock) *
        useAppSelector(selectTotalBlocks)
    const sectorsPerTrack = totalSectors / trackCount
    const dispatch = useAppDispatch()
    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(2),
                flexWrap: "wrap",
            }}
        >
            <Typography
                sx={{ width: "100%", textAlign: "center" }}
                variant="h5"
            >
                Set Up Your Disk
            </Typography>
            <hr style={{ width: "100%", marginTop: "-5px" }} />
            <Tooltip
                placement="top"
                title="Tracks are the rings around the disk that the read / write head seeks. Tracks are typically thinner than the width of a human hair."
            >
                <FormControl required fullWidth>
                    <InputLabel id="track-count-label">
                        Number of Tracks
                    </InputLabel>
                    <Select
                        value={trackCount}
                        onChange={(event) =>
                            dispatch(
                                setTrackCount(
                                    +event.target.value as 1 | 2 | 4 | 8,
                                ),
                            )
                        }
                        label="Number of Tracks"
                        labelId="track-count-label"
                    >
                        {[...Array(4)].map((_, i) => (
                            <MenuItem key={`menu-item-${i}`} value={2 ** i}>
                                {2 ** i}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Tooltip>
            <Tooltip
                placement="top"
                title="Sectors are the smallest addressable unit on a hard drive disk (and thus disks are not byte-addressable!)"
            >
                <TextField
                    label="Sector Size"
                    disabled
                    value={getByteCount(sectorSize)}
                    fullWidth
                />
            </Tooltip>
            <Tooltip
                placement="top"
                title="The total storage capacity of this disk."
            >
                <TextField
                    label="Disk Size"
                    disabled
                    value={getByteCount(diskSize)}
                    fullWidth
                />
            </Tooltip>
            <Tooltip
                placement="top"
                title="The number of sectors allocated per track. For this visualization, it's simply the number of sectors / number of tracks. Real disks would be able to place more sectors on tracks further from the center."
            >
                <TextField
                    label="Sectors Per Track"
                    disabled
                    value={sectorsPerTrack}
                    fullWidth
                />
            </Tooltip>
            <Button
                variant="contained"
                sx={{ marginLeft: "auto" }}
                onClick={() => {
                    dispatch(
                        setSectors(
                            [...Array(totalSectors)].map(() => ({
                                data: "0".repeat(sectorSize),
                            })),
                        ),
                    )
                    dispatch(setIsAwaitingDisk(false))
                }}
            >
                Finish
            </Button>
        </Box>
    )
}

export default SetUpDisk

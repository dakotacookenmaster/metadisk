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
import { FileSystemSetup } from "../VSFS"
import Tooltip from "../../common/components/Tooltip"

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

const SetUpFileSystem = (props: FileSystemSetup) => {
    const {
        minimumRequiredDiskSize,
        totalBlocks,
        setTotalBlocks,
        setIsFinishedConfiguringFileSystem,
        name,
        blockSize,
        sectorsPerBlock,
        setSectorsPerBlock,
        sectorSize,
        setSectorSize,
        setIsAwaitingDisk
    } = props
    const theme = useTheme()
    
    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
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
                Set Up Your File System
            </Typography>
            <hr style={{ width: "100%", marginTop: "-5px" }} />
            <Tooltip
                placement="top"
                title="The name of the file system, though this value is often represented simply as a number in the superblock."
            >
                <TextField
                    disabled
                    label="File System Name"
                    fullWidth
                    value={name}
                />
            </Tooltip>
            <Tooltip
                placement="top"
                title="Sectors are the smallest addressable unit on a hard drive disk (and thus disks are not byte-addressable!)"
            >
                <FormControl required fullWidth>
                    <InputLabel id="sector-size-label">Sector Size</InputLabel>
                    <Select
                        value={sectorSize}
                        onChange={(event) =>
                            setSectorSize(+(event.target.value as number))
                        }
                        label="Sector Size"
                        labelId="sector-size-label"
                    >
                        {[...Array(6)].map((_, i) => (
                            <MenuItem
                                key={`menu-item-${i}`}
                                value={2 ** (i + 9)}
                            >
                                {getByteCount(2 ** (i + 9))}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Tooltip>
            <Tooltip
                placement="top"
                title="The number of sectors in a block will determine how large in bytes a block is."
            >
                <FormControl required fullWidth>
                    <InputLabel id="sectors-per-block-label">
                        Sectors Per Block
                    </InputLabel>
                    <Select
                        value={sectorsPerBlock}
                        onChange={(event) => {
                            setSectorsPerBlock(+(event.target.value as number))
                        }}
                        label="Sectors Per Block"
                        labelId="sectors-per-block-label"
                    >
                        {[...Array(3)].map((_, i) => (
                            <MenuItem key={`menu-item-${i}`} value={i + 1}>
                                {i + 1} sectors
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Tooltip>
            <Tooltip
                placement="top"
                title="VSFS uses bitmaps to track available blocks. As any file stored on the file system must take up at least one block, the number of blocks essentially defines the maximum number of files the system can store."
            >
                <FormControl required fullWidth>
                    <InputLabel id="total-blocks-label">
                        Total Blocks
                    </InputLabel>
                    <Select
                        value={totalBlocks}
                        onChange={(event) => {
                            setTotalBlocks(+(event.target.value as number))
                        }}
                        label="Total Blocks"
                        labelId="total-blocks-label"
                    >
                        {[...Array(3)].map((_, i) => (
                            <MenuItem
                                key={`menu-item-${i}`}
                                value={2 ** (i + 2)}
                            >
                                {(2 ** (i + 2)).toLocaleString()} blocks
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Tooltip>
            <Tooltip
                placement="top"
                title="As each file in the system must take up at least one block, no file is technically smaller than this size. It's imperative to find a good balance when choosing a block size to avoid wasting space on small files."
            >
                <TextField
                    label="Block Size"
                    fullWidth
                    disabled
                    value={getByteCount(blockSize)}
                />
            </Tooltip>
            <Tooltip
                placement="top"
                title="To be able to store the number of blocks you've chosen with the sectors and sector sizes provided, you'll need at least this much space on a disk."
            >
                <TextField
                    label="Minimum Required Disk Size"
                    fullWidth
                    disabled
                    value={getByteCount(minimumRequiredDiskSize)}
                />
            </Tooltip>
            <Button
                variant="contained"
                sx={{ marginLeft: "auto" }}
                onClick={() => {
                    setIsAwaitingDisk(true)
                    setIsFinishedConfiguringFileSystem(true)
                }}
            >
                Finish
            </Button>
        </Box>
    )
}

export default SetUpFileSystem

import * as React from "react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Box from "@mui/material/Box"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import {
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableRow,
    useTheme,
} from "@mui/material"
import Tooltip from "../../common/components/Tooltip"
import WaitingMessage from "../../common/components/WaitingMessage"
import Viewer from "./Viewers"
import CalculateIcon from "@mui/icons-material/Calculate"
import SaveAltIcon from "@mui/icons-material/SaveAlt"
import { getByteCount } from "../../disk-simulator/components/SetUpDisk"
import { blue, brown, green, purple, red } from "@mui/material/colors"
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3, minHeight: "400px" }}>{children}</Box>
            )}
        </div>
    )
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    }
}

export default function SuperblockTabs(props: {
    data: string | undefined
    progress: number
}) {
    const { data, progress } = props
    const [value, setValue] = React.useState(0)
    const superblock = useAppSelector(selectSuperblock)
    const theme = useTheme()
    const [shouldHighlight, setShouldHighlight] = React.useState(true)
    const styles = {
        row: {
            "&:hover": {
                background: theme.palette.primary.main,
                cursor: "pointer",
                userSelect: "none",
            },
        },
    }

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue)
    }

    if (!data) {
        return (
            <WaitingMessage
                message="Reading from disk..."
                progress={progress}
            />
        )
    }

    const magicNumber = data.slice(0, 8)
    const inodeCount = data.slice(8, 24)
    const inodeBlocks = data.slice(24, 28)
    const dataBlocks = data.slice(28, 32)
    const blockSize = data.slice(32, 56)

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="basic tabs example"
                >
                    <Tab label="Overview" {...a11yProps(0)} />
                    <Tab label="Binary" {...a11yProps(1)} />
                    <Tab label="Hex" {...a11yProps(2)} />
                    <Tab label="ASCII" {...a11yProps(3)} />
                    {value === 1 && (
                        <IconButton
                            onClick={() =>
                                setShouldHighlight(
                                    (prevShouldHighlight) =>
                                        !prevShouldHighlight,
                                )
                            }
                            sx={{ position: "absolute", top: 3, right: 3 }}
                        >
                            <AutoFixHighIcon />
                        </IconButton>
                    )}
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <Table sx={{ marginTop: "-20px" }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Source</TableCell>
                            <TableCell>Field</TableCell>
                            <TableCell>Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <Tooltip
                            placement="top"
                            title="The name of the file system."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>
                                    <CalculateIcon />
                                </TableCell>
                                <TableCell>System Name</TableCell>
                                <TableCell>
                                    {parseInt(magicNumber, 2) ===
                                    superblock.magicNumber
                                        ? superblock.name
                                        : "Unknown File System (System Potentially Corrupted)"}
                                </TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="A magic number is a number chosen specifically to represent some idea, in this case the type of file system (vsfs). The name of the file system in the row above is actually just an extrapolation based on this value."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>
                                    <SaveAltIcon />
                                </TableCell>
                                <TableCell>Magic Number</TableCell>
                                <TableCell>
                                    {parseInt(magicNumber, 2)}{" "}
                                </TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="The number of inodes (index nodes). Specifically, this is the theoretical maximum number of files and directories the file system could point to on disk."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>
                                    <SaveAltIcon />
                                </TableCell>
                                <TableCell>Inodes</TableCell>
                                <TableCell>{parseInt(inodeCount, 2)}</TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="The total number of blocks allocated to store inodes."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>
                                    <SaveAltIcon />
                                </TableCell>
                                <TableCell>Inode Blocks</TableCell>
                                <TableCell>
                                    {parseInt(inodeBlocks, 2)}
                                </TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="The number of data blocks. This is the real maximum number of files or directories the system can store. Blocks are the smallest unit in the file system."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>
                                    <SaveAltIcon />
                                </TableCell>
                                <TableCell>Data Blocks</TableCell>
                                <TableCell>{parseInt(dataBlocks, 2)}</TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="The size of a logical block in the file system."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>
                                    <SaveAltIcon />
                                </TableCell>
                                <TableCell>Block Size</TableCell>
                                <TableCell>
                                    {getByteCount(parseInt(blockSize, 2))}
                                </TableCell>
                            </TableRow>
                        </Tooltip>
                    </TableBody>
                    <TableFooter></TableFooter>
                </Table>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <Viewer shouldHighlight={shouldHighlight} highlights={{
                    ranges: [
                        {
                            startRow: 1,
                            startColumn: 1,
                            endRow: 1,
                            endColumn: 9,
                            backgroundColor: red[700],
                            label: "Magic Number",
                        },
                        {
                            startRow: 1,
                            startColumn: 9,
                            endRow: 1,
                            endColumn: 10,
                        },
                        {
                            startRow: 1,
                            startColumn: 10,
                            endRow: 1,
                            endColumn: 27,
                            backgroundColor: blue[700],
                            label: "Inode Count",
                        },
                        {
                            startRow: 1,
                            startColumn: 27,
                            endRow: 1,
                            endColumn: 28,
                        },
                        {
                            startRow: 1,
                            startColumn: 28,
                            endRow: 1,
                            endColumn: 32,
                            backgroundColor: green[700],
                            label: "Inode Blocks",
                        },
                        {
                            startRow: 1,
                            startColumn: 32,
                            endRow: 1,
                            endColumn: 36,
                            backgroundColor: purple[700],
                            label: "Data Blocks",
                        },
                        {
                            startRow: 2,
                            startColumn: 1,
                            endRow: 2,
                            endColumn: 27,
                            backgroundColor: brown[500],
                            label: "Block Size",
                        }
                    ],
                }} data={data} mode="bin" />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
                <Viewer data={data} mode="hex" />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={3}>
                <Viewer data={data} mode="ascii" />
            </CustomTabPanel>
        </Box>
    )
}

import * as React from "react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Box from "@mui/material/Box"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import {
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
import { getByteCount } from "../../disk-simulator/components/SetUpDisk"

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
    data: Uint8Array | undefined
    progress: number
}) {
    const { data, progress } = props
    const [value, setValue] = React.useState(0)
    const superblock = useAppSelector(selectSuperblock)
    const theme = useTheme()
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

    const magicNumber = data[0]
    const inodeCount = data[1] << 8 | data[2]
    const inodeBlocks = data[3] >> 4
    const dataBlocks = data[3] & 0xF
    const blockSize = data[4] << 16 | data[5] << 8 | data[6]

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
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <Table>
                    <TableHead>
                        <TableRow>
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
                                <TableCell>System Name</TableCell>
                                <TableCell>
                                    {magicNumber ===
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
                                <TableCell>Magic Number</TableCell>
                                <TableCell>
                                    {magicNumber}{" "}
                                </TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="The number of inodes (index nodes). Specifically, this is the theoretical maximum number of files and directories the file system could point to on disk."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>Inodes</TableCell>
                                <TableCell>{inodeCount}</TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="The total number of blocks allocated to store inodes."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>Total Inode Blocks</TableCell>
                                <TableCell>
                                    {inodeBlocks}
                                </TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="The number of data blocks. This is the real maximum number of files or directories the system can store. Blocks are the smallest unit in the file system."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>Data Blocks</TableCell>
                                <TableCell>{dataBlocks}</TableCell>
                            </TableRow>
                        </Tooltip>
                        <Tooltip
                            placement="top"
                            title="The size of a logical block in the file system."
                        >
                            <TableRow sx={styles.row}>
                                <TableCell>Block Size</TableCell>
                                <TableCell>{getByteCount(blockSize)}</TableCell>
                            </TableRow>
                        </Tooltip>
                    </TableBody>
                    <TableFooter></TableFooter>
                </Table>
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <Viewer data={data} mode="bin" />
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

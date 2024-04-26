import * as React from "react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Box from "@mui/material/Box"
import WaitingMessage from "../../common/components/WaitingMessage"
import Viewer from "./Viewers"
import getAllDirectories from "../../common/helpers/getAllDirectories"
import { Table, TableBody, TableCell, TableHead, TableRow, useTheme } from "@mui/material"
import DirectoryEntry from "../../../apis/interfaces/vsfs/DirectoryEntry.interface"
import { readBlock } from "../../../apis/vsfs/system/ReadBlock.vsfs"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { selectSectors } from "../../../redux/reducers/diskSlice"
import { blue } from "@mui/material/colors"

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
    style?: any
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

export default function DataBlockTabs(props: {
    data: string | undefined
    blockNumber: number
    progress: number
}) {
    const { data, progress, blockNumber } = props
    const [value, setValue] = React.useState(0)
    const [dir, setDir] = React.useState(false)
    const [entries, setEntries] = React.useState<DirectoryEntry[]>([])
    const [finished, setFinished] = React.useState<boolean>(false)
    const { inodeStartIndex, numberOfInodeBlocks } =
        useAppSelector(selectSuperblock)
    const sectors = useAppSelector(selectSectors)
    const theme = useTheme()

    React.useEffect(() => {
        ;(async () => {
            const directories = await getAllDirectories()
            if (
                directories.blocks.includes(
                    blockNumber + inodeStartIndex + numberOfInodeBlocks,
                )
            ) {
                setDir(true)
                const dirEntries = (
                    await readBlock(
                        blockNumber + inodeStartIndex + numberOfInodeBlocks,
                    )
                ).data.directory.entries
                const valid = []
                for (let entry of dirEntries) {
                    if (!entry.free) {
                        valid.push(entry)
                    }
                }
                setEntries(valid)
            }
            setFinished(true)
        })()
    }, [sectors])

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue)
    }

    if (!data || !finished) {
        return (
            <WaitingMessage
                message="Reading from disk..."
                progress={progress}
            />
        )
    }

    return (
        <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="basic tabs example"
                >
                    {dir && (
                        <Tab label="Directory Viewer" {...a11yProps(0)} />
                    )}
                    <Tab label="Binary" {...a11yProps(dir ? 1 : 0)} />
                    <Tab label="Hex" {...a11yProps(dir ? 2 : 1)} />
                    <Tab label="ASCII" {...a11yProps(dir ? 3 : 2)} />
                </Tabs>
            </Box>
            {dir && (
                <CustomTabPanel
                    value={value}
                    index={0}
                    style={{
                        height: "400px",
                        maxHeight: "100%",
                        overflowY: "scroll",
                        scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                        scrollbarWidth: "thin",
                        paddingRight: "20px"
                    }}
                >
                    <Table sx={{ maxHeight: "20px", overflow: "hidden" }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Directory Name</TableCell>
                                <TableCell>Inode Number</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {
                                entries
                                    .map((entry, index) => {
                                        if (!entry.free) {
                                            return (
                                                <TableRow
                                                    key={`entry-${index}`}
                                                >
                                                    <TableCell>
                                                        {entry.name.replaceAll(
                                                            "\uE400",
                                                            "",
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {entry.inode}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        }
                                    })
                                    .filter((v) => v) // remove null entries
                            }
                        </TableBody>
                    </Table>
                </CustomTabPanel>
            )}
            <CustomTabPanel value={value} index={dir ? 1 : 0}>
                <Viewer data={data} mode="bin" />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={dir ? 2 : 1}>
                <Viewer data={data} mode="hex" />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={dir ? 3 : 2}>
                <Viewer data={data} mode="ascii" />
            </CustomTabPanel>
        </Box>
    )
}

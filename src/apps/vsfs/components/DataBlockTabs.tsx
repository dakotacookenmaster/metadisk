import * as React from "react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Box from "@mui/material/Box"
import WaitingMessage from "../../common/components/WaitingMessage"
import Viewer from "./Viewers"
import getAllDirectories from "../../common/helpers/getAllDirectories"
import {
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    useTheme,
} from "@mui/material"
import DirectoryEntry from "../../../apis/interfaces/vsfs/DirectoryEntry.interface"
import { readBlock } from "../../../apis/vsfs/system/ReadBlock.vsfs"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import { selectSectors } from "../../../redux/reducers/diskSlice"
import { blue, green } from "@mui/material/colors"
import getLabel from "../../common/helpers/getLabel"
import getInodeLocation from "../../../apis/vsfs/system/GetInodeLocation.vsfs"
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"
import { chunk } from "lodash"

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
    style?: object
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
    setSelected: React.Dispatch<React.SetStateAction<string>>
    setBlockNumber: React.Dispatch<React.SetStateAction<number>>
    setSelectedInode: React.Dispatch<React.SetStateAction<number | undefined>>
    beginOperation: () => void
    blockRefs: React.RefObject<unknown>[]
    canMove: boolean
}) {
    const {
        data,
        progress,
        blockRefs,
        blockNumber,
        canMove,
        setSelected,
        setBlockNumber,
        setSelectedInode,
        beginOperation,
    } = props
    const [value, setValue] = React.useState(0)
    const [dir, setDir] = React.useState(false)
    const [entries, setEntries] = React.useState<DirectoryEntry[]>([])
    const [finished, setFinished] = React.useState<boolean>(false)
    const { inodeStartIndex, numberOfInodeBlocks } =
        useAppSelector(selectSuperblock)
    const sectors = useAppSelector(selectSectors)
    const theme = useTheme()
    const [shouldHighlight, setShouldHighlight] = React.useState(true)

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
                for (const entry of dirEntries) {
                    if (!entry.free) {
                        valid.push(entry)
                    }
                }
                setEntries(valid)
            } else {
                setDir(false)
            }
            setFinished(true)
        })()
    }, [sectors])

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue)
    }

    function getRanges(data: string) {
        const ranges = []
        const chunks = chunk(data, 128)
        for (let i = 0; i < chunks.length; i++) {
            if(chunks[i].join("") === "0".repeat(128)) {
                continue;
            }
            const directoryNameRange = {
                startRow: 1 + 4 * i,
                startColumn: 0,
                endRow: 4 + 4 * i,
                endColumn: 9,
                backgroundColor: green[900],
                label: "Name",
            }

            const inodeNumberRange = {
                startRow: 4 + 4 * i,
                startColumn: 10,
                endRow: 4 + 4 * i,
                endColumn: 36,
                backgroundColor: blue[900],
                label: "Inode Number",
            }

            ranges.push(directoryNameRange)
            ranges.push(inodeNumberRange)
        }

        return ranges
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
                    {dir && <Tab label="Directory Viewer" {...a11yProps(0)} />}
                    <Tab label="Binary" {...a11yProps(dir ? 1 : 0)} />
                    <Tab label="Hex" {...a11yProps(dir ? 2 : 1)} />
                    <Tab label="ASCII" {...a11yProps(dir ? 3 : 2)} />
                    {value === 1 && dir && (
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
            {dir && (
                <CustomTabPanel
                    value={value}
                    index={0}
                    style={{
                        height: "400px",
                        maxHeight: "100%",
                        overflowY: "auto",
                        scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                        scrollbarWidth: "thin",
                        paddingRight: "20px",
                    }}
                >
                    <Table sx={{ maxHeight: "20px", overflow: "hidden" }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
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
                                                        {entry.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box
                                                            onClick={() => {
                                                                if (canMove) {
                                                                    setSelectedInode(
                                                                        entry.inode,
                                                                    )
                                                                    setSelected(
                                                                        (
                                                                            prevLabel,
                                                                        ) => {
                                                                            const {
                                                                                inodeBlock,
                                                                            } =
                                                                                getInodeLocation(
                                                                                    entry.inode,
                                                                                )
                                                                            setBlockNumber(
                                                                                inodeBlock,
                                                                            )
                                                                            const newLabel =
                                                                                getLabel(
                                                                                    inodeBlock,
                                                                                )
                                                                            if (
                                                                                prevLabel !==
                                                                                newLabel
                                                                            ) {
                                                                                beginOperation()
                                                                            }
                                                                            return newLabel
                                                                        },
                                                                    )
                                                                    const ref =
                                                                        blockRefs[
                                                                            index
                                                                        ]
                                                                            .current as Element
                                                                    ref.scrollIntoView(
                                                                        {
                                                                            behavior:
                                                                                "smooth",
                                                                            block: "nearest",
                                                                        },
                                                                    )
                                                                }
                                                            }}
                                                            sx={{
                                                                fontWeight:
                                                                    "bold",
                                                                width: "30px",
                                                                height: "30px",
                                                                border: "2px solid white",
                                                                borderRadius:
                                                                    "100%",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                backgroundColor:
                                                                    theme
                                                                        .palette
                                                                        .success
                                                                        .main,
                                                                "&:hover": {
                                                                    cursor: canMove
                                                                        ? "pointer"
                                                                        : "not-allowed",
                                                                    backgroundColor:
                                                                        green[600],
                                                                    border: "none",
                                                                },
                                                            }}
                                                        >
                                                            {entry.inode}
                                                        </Box>
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
                <Viewer
                    highlights={{
                        ranges: getRanges(data),
                    }}
                    shouldHighlight={shouldHighlight}
                    data={data}
                    mode="bin"
                />
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

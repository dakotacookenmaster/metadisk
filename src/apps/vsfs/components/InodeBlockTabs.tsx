import * as React from "react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Box from "@mui/material/Box"
import WaitingMessage from "../../common/components/WaitingMessage"
import Viewer from "./Viewers"
import InodeOverview from "./InodeOverview"
import { IconButton } from "@mui/material"
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import { chunk } from "lodash"
import {
    amber,
    brown,
    cyan,
    deepOrange,
    deepPurple,
    green,
    lightGreen,
    lime,
    pink,
    purple,
    red,
    teal,
    indigo,
    blueGrey,
    lightBlue,
} from "@mui/material/colors"

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

export default function InodeBlockTabs(props: {
    data: string | undefined
    progress: number
    setSelected: React.Dispatch<React.SetStateAction<string>>
    blockRefs: React.RefObject<unknown>[]
    canMove: boolean
    beginOperation: () => void
    blockNumber: number
    setBlockNumber: React.Dispatch<React.SetStateAction<number>>
    inodeBitmap: string
    selectedInode: number | undefined
    setSelectedInode: React.Dispatch<React.SetStateAction<number | undefined>>
}) {
    const {
        data,
        progress,
        setSelected,
        blockRefs,
        canMove,
        beginOperation,
        blockNumber,
        setBlockNumber,
        inodeBitmap,
        selectedInode,
        setSelectedInode,
    } = props
    const [value, setValue] = React.useState(0)
    const [shouldHighlight, setShouldHighlight] = React.useState(true)

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue)
    }

    function buildRanges(data: string) {
        // Each inode is exactly 128 bytes.
        // The first two bits are the type (file or directory)
        // The next 6 bits are the permissions (read, write, execute)
        // The next 24 bits are the size of the file in bytes
        // The next 32 bits are the created at timestamp since the epoch
        // The next 32 bits are the last modified timestamp since the epoch
        // The next 32 bits are the block pointers (8 pointers of 4 bits each)
        const chunks = chunk(data, 128)
        const ranges = []
        for (let i = 0; i < chunks.length; i++) {
            const fileRange = {
                startRow: 1 + 4 * i,
                startColumn: 0,
                endRow: 1 + 4 * i,
                endColumn: 3,
                backgroundColor: deepPurple[800],
                label: "Type",
            }

            const readRange = {
                startRow: 1 + 4 * i,
                startColumn: 3,
                endRow: 1 + 4 * i,
                endColumn: 5,
                backgroundColor: cyan[800],
                label: "Read",
            }

            const writeRange = {
                startRow: 1 + 4 * i,
                startColumn: 5,
                endRow: 1 + 4 * i,
                endColumn: 7,
                backgroundColor: amber[800],
                label: "Write",
            }

            const executeRange = {
                startRow: 1 + 4 * i,
                startColumn: 7,
                endRow: 1 + 4 * i,
                endColumn: 9,
                backgroundColor: deepOrange[800],
                label: "Execute",
            }

            const sizeRange = {
                startRow: 1 + 4 * i,
                startColumn: 10,
                endRow: 1 + 4 * i,
                endColumn: 36,
                backgroundColor: lightGreen[800],
                label: "Size (b)",
            }

            const createdAtRange = {
                startRow: 2 + 4 * i,
                startColumn: 1,
                endRow: 2 + 4 * i,
                endColumn: 68,
                backgroundColor: lime[800],
                label: "Created At",
            }

            const updatedAtRange = {
                startRow: 3 + 4 * i,
                startColumn: 1,
                endRow: 3 + 4 * i,
                endColumn: 68,
                backgroundColor: indigo[800],
                label: "Updated At",
            }

            const blockPointersRanges = []
            const colors = [
                lightBlue[800],
                pink[800], 
                green[900],
                brown[900],
                teal[900],
                purple[900],
                red[900],
                blueGrey[800],
            ]
            let additionalOffset = 0
            for (let j = 0; j < 8; j++) {
                const startColumn = 1 + 4 * j
                const endColumn = 5 + 4 * j
                if (j % 2 === 0 && j !== 0) {
                    additionalOffset++
                }
                const blockPointerRange = {
                    startRow: 4 + 4 * i,
                    startColumn: startColumn + additionalOffset,
                    endRow: 4 + 4 * i,
                    endColumn: endColumn + additionalOffset,
                    backgroundColor: colors[j],
                    label: `Block Pointer ${j}`,
                }
                blockPointersRanges.push(blockPointerRange)
            }

            if (inodeBitmap[i] === "1") {
                ranges.push(fileRange)
                ranges.push(readRange)
                ranges.push(writeRange)
                ranges.push(executeRange)
                ranges.push(sizeRange)
                ranges.push(createdAtRange)
                ranges.push(updatedAtRange)
                ranges.push(...blockPointersRanges)
            } else if(inodeBitmap[i] === "0" && chunks[i].includes("1")) {
                ranges.push({
                    startRow: 1 + 4 * i,
                    startColumn: 0,
                    endRow: 4 + 4 * i,
                    endColumn: 36,
                    backgroundColor: red[400],
                    label: "Deleted File or Directory",
                })
            }
        }

        return ranges
    }

    if (!data) {
        return (
            <WaitingMessage
                message="Reading from disk..."
                progress={progress}
            />
        )
    }

    return (
        <Box sx={{ width: "100%", position: "relative" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="basic tabs example"
                >
                    <Tab label="Inode Viewer" {...a11yProps(0)} />
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
                            sx={{ position: "absolute", top: 3, right: selectedInode === undefined ? 3 : 45 }}
                        >
                            <AutoFixHighIcon />
                        </IconButton>
                    )}
                </Tabs>
                {selectedInode !== undefined && (
                    <IconButton
                        onClick={() => {
                            setSelectedInode(undefined)
                            setValue(0)
                        }}
                        sx={{ position: "absolute", top: 3, right: 0 }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Box>
            <CustomTabPanel value={value} index={0}>
                <InodeOverview
                    inodeBitmap={inodeBitmap}
                    data={data}
                    canMove={canMove}
                    setSelected={setSelected}
                    blockRefs={blockRefs}
                    beginOperation={beginOperation}
                    blockNumber={blockNumber}
                    selectedInode={selectedInode}
                    setSelectedInode={setSelectedInode}
                    setBlockNumber={setBlockNumber}
                />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <Viewer
                    highlights={{
                        ranges: buildRanges(data),
                    }}
                    shouldHighlight={shouldHighlight}
                    data={data}
                    mode="bin"
                />
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

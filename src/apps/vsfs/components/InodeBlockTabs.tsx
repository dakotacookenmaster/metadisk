import * as React from "react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Box from "@mui/material/Box"
import WaitingMessage from "../../common/components/WaitingMessage"
import Viewer from "./Viewers"
import InodeOverview from "./InodeOverview"
import { useState } from "react"
import { IconButton } from "@mui/material"
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'

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
    canMove: boolean
    beginOperation: () => void
    blockNumber: number
    setBlockNumber: React.Dispatch<React.SetStateAction<number>>
    inodeBitmap: string
    selectedInode: number | undefined
    setSelectedInode: React.Dispatch<React.SetStateAction<number | undefined>>
}) {
    const { data, progress, setSelected, canMove, beginOperation, blockNumber, setBlockNumber, inodeBitmap, selectedInode, setSelectedInode } = props
    const [value, setValue] = React.useState(0)

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
                </Tabs>
                {
                    selectedInode !== undefined && (
                        <IconButton onClick={() => setSelectedInode(undefined) } sx={{ position: "absolute", top: 3, right: 0 }}>
                            <ChevronLeftIcon />
                        </IconButton>
                    )
                }
            </Box>
            <CustomTabPanel value={value} index={0}>
                <InodeOverview
                    inodeBitmap={inodeBitmap}
                    data={data}
                    canMove={canMove}
                    setSelected={setSelected}
                    beginOperation={beginOperation}
                    blockNumber={blockNumber}
                    selectedInode={selectedInode}
                    setSelectedInode={setSelectedInode}
                    setBlockNumber={setBlockNumber}
                />
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

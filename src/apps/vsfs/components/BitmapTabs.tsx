import * as React from "react"
import Tabs from "@mui/material/Tabs"
import Tab from "@mui/material/Tab"
import Box from "@mui/material/Box"
import WaitingMessage from "../../common/components/WaitingMessage"
import Viewer from "./Viewers"
import Bitmap from "./Bitmap"

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

export default function BitmapTabs(props: {
    data: string | undefined
    progress: number
    type: "inode" | "data"
    setSelectedInode: React.Dispatch<React.SetStateAction<number | undefined>>
    setBlockNumber: React.Dispatch<React.SetStateAction<number>>
    setSelected: React.Dispatch<React.SetStateAction<string>>
}) {
    const {
        data,
        progress,
        type,
        setBlockNumber,
        setSelectedInode,
        setSelected,
    } = props
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
                <Bitmap
                    setSelected={setSelected}
                    setBlockNumber={setBlockNumber}
                    setSelectedInode={setSelectedInode}
                    type={type}
                    data={data}
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

import { Box, IconButton, Typography, useTheme } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectSuperblock,
    selectTotalBlocks,
} from "../../../redux/reducers/fileSystemSlice"
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"
import FileSystemBlockLayoutDropdown from "./FileSystemBlockLayoutDropdown"
import { useState } from "react"
import { blue } from "@mui/material/colors"
import SuperblockTabs from "./SuperblockTabs"

const FileSystemBlockLayout = () => {
    const totalBlocks = useAppSelector(selectTotalBlocks)
    const numberOfInodeBlocks = useAppSelector(selectSuperblock).numberOfInodeBlocks
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const theme = useTheme()
    const [selected, setSelected] = useState<string>("Superblock")

    const getLabel = (index: number) => {
        if (index === 0) {
            return "Superblock"
        } else if (index === 1) {
            return "Inode Bitmap"
        } else if (index === 2) {
            return "Data Bitmap"
        } else if (index <= 2 + numberOfInodeBlocks) {
            return `Inode Block ${index - 3}`
        } else {
            return `Data Block ${index - 3 - numberOfInodeBlocks}`
        }
    }

    return (
        <Box sx={{ padding: theme.spacing(1) }}>
            <Box sx={{ display: "flex" }}>
                <FileSystemBlockLayoutDropdown
                    anchorEl={anchorEl}
                    setAnchorEl={setAnchorEl}
                />
                <Typography
                    variant="h5"
                    sx={{ width: "100%", textAlign: "center" }}
                >
                    File System Block Layout
                </Typography>
                <IconButton
                    sx={{ marginLeft: "auto" }}
                    onClick={(event) =>
                        setAnchorEl(event.target as HTMLElement)
                    }
                >
                    <MoreHorizIcon />
                </IconButton>
            </Box>
            <Box
                sx={{
                    display: "flex",
                    overflowX: "scroll",
                    marginTop: theme.spacing(2),
                    paddingBottom: theme.spacing(2),
                    scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`
                }}
            >
                {[...Array(totalBlocks)].map((_, i) => {
                    return (
                        <Box
                            className="block"
                            key={`block-${i}`}
                            sx={{
                                border: `3px solid ${theme.palette.primary.main}`,
                                "&:nth-of-type(n + 2)": {
                                    borderLeft: "0px",
                                },
                                minWidth: "100px",
                                height: "100px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "12.5px",
                                fontWeight: "bold",
                                textAlign: "center",
                                userSelect: "none",
                                "&:hover": {
                                    cursor: "pointer",
                                    background: theme.palette.primary.main,
                                },
                                background: selected === getLabel(i) ? theme.palette.primary.main : undefined,
                            }}
                            onClick={() => {
                                setSelected(getLabel(i))
                            }}
                        >
                            {getLabel(i)}
                        </Box>
                    )
                })}
            </Box>
            {
                selected === "Superblock" && (
                    <SuperblockTabs />
                )
            }
        </Box>
    )
}

export default FileSystemBlockLayout

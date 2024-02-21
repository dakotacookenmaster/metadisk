import { Box, Typography, useTheme } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectSuperblock,
    selectTotalBlocks,
} from "../../../redux/reducers/fileSystemSlice"
import { useEffect, useState } from "react"
import { blue } from "@mui/material/colors"
import SuperblockTabs from "./SuperblockTabs"
import BitmapTabs from "./BitmapTabs"
import { readBlock } from "../../../apis/vsfs"

const FileSystemBlockLayout = () => {
    const totalBlocks = useAppSelector(selectTotalBlocks)
    const numberOfInodeBlocks =
        useAppSelector(selectSuperblock).numberOfInodeBlocks
    const theme = useTheme()
    const [selected, setSelected] = useState<string>("Superblock")
    const [progress, setProgress] = useState<number>(0)
    const [data, setData] = useState<string | undefined>(undefined)
    const [canMove, setCanMove] = useState(false)

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

    useEffect(() => {
        // Start by reading from the superblock
        ;(async () => {
            setData(undefined)
            setProgress(0)
            setCanMove(false)
            if (selected === "Superblock") {
                const result = await readBlock(0, (progress: number) => setProgress(progress))
                setData(result.data)
            } else if (selected === "Inode Bitmap") {
                const result = await readBlock(1, (progress: number) => setProgress(progress))
                setData(result.data)
            } else if (selected === "Data Bitmap") {
                const result = await readBlock(2, (progress: number) => setProgress(progress))
                setData(result.data)
            }
            setCanMove(true)
        })()
    }, [selected])

    return (
        <Box sx={{ padding: theme.spacing(1) }}>
            <Box sx={{ display: "flex" }}>
                <Typography
                    variant="h5"
                    sx={{ width: "100%", textAlign: "center" }}
                >
                    File System Block Layout
                </Typography>
            </Box>
            <Box
                sx={{
                    display: "flex",
                    overflowX: "scroll",
                    marginTop: theme.spacing(2),
                    paddingBottom: theme.spacing(2),
                    scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
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
                                    cursor: canMove ? "pointer" : "not-allowed",
                                    background: canMove ? theme.palette.primary.main : undefined,
                                },
                                background:
                                    selected === getLabel(i)
                                        ? theme.palette.primary.main
                                        : undefined,
                            }}
                            onClick={() => {
                                if (canMove) {
                                    setSelected(getLabel(i))
                                }
                            }}
                        >
                            {getLabel(i)}
                        </Box>
                    )
                })}
            </Box>
            {selected === "Superblock" && (
                <SuperblockTabs data={data} progress={progress} />
            )}
            {selected === "Inode Bitmap" && (
                <BitmapTabs data={data} progress={progress} />
            )}
            {selected === "Data Bitmap" && (
                <BitmapTabs data={data} progress={progress} />
            )}
        </Box>
    )
}

export default FileSystemBlockLayout

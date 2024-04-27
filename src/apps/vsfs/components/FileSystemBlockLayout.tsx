import { Box, Typography, useTheme } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectTotalBlocks } from "../../../redux/reducers/fileSystemSlice"
import { createRef, useEffect, useMemo, useState } from "react"
import { blue } from "@mui/material/colors"
import SuperblockTabs from "./SuperblockTabs"
import BitmapTabs from "./BitmapTabs"
import { readBlock } from "../../../apis/vsfs/system/ReadBlock.vsfs"
import InodeBlockTabs from "./InodeBlockTabs"
import DataBlockTabs from "./DataBlockTabs"
import { selectSectors } from "../../../redux/reducers/diskSlice"
import getLabel from "../../common/helpers/getLabel"

const FileSystemBlockLayout = () => {
    const totalBlocks = useAppSelector(selectTotalBlocks)
    const theme = useTheme()
    const [selected, setSelected] = useState<string>("Superblock")
    const [progress, setProgress] = useState<number>(0)
    const sectors = useAppSelector(selectSectors)
    const [data, setData] = useState<string | undefined>(undefined)
    const [canMove, setCanMove] = useState(false)
    const [blockNumber, setBlockNumber] = useState(0)
    const [inodeBitmap, setInodeBitmap] = useState("")
    const [selectedInode, setSelectedInode] = useState<number | undefined>(
        undefined,
    )
    const blockRefs = useMemo(() => {
        return [...Array(totalBlocks)].map((_) => createRef())
    }, [])

    const beginOperation = () => {
        setData(undefined)
        setProgress(0)
        setCanMove(false)
    }

    useEffect(() => {
        ;(async () => {
            const result = (await readBlock(1)).data.raw
            setInodeBitmap(result)
        })()
    }, [sectors])

    useEffect(() => {
        // Start by reading from the superblock
        ;(async () => {
            const result = (
                await readBlock(blockNumber, (progress: number) =>
                    setProgress(progress),
                )
            ).data.raw
            setData(result)
            setCanMove(true)
        })()
    }, [selected, sectors])

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
                    scrollbarWidth: "thin",
                }}
            >
                {[...Array(totalBlocks)].map((_, i) => {
                    return (
                        <Box
                            ref={blockRefs[i]}
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
                                    background: canMove
                                        ? theme.palette.primary.main
                                        : undefined,
                                },
                                background:
                                    selected === getLabel(i)
                                        ? theme.palette.primary.main
                                        : undefined,
                            }}
                            onClick={() => {
                                if (canMove) {
                                    setSelectedInode(undefined)
                                    setSelected((prevLabel) => {
                                        setBlockNumber(i)
                                        const newLabel = getLabel(i)
                                        if (prevLabel !== newLabel) {
                                            beginOperation()
                                        }
                                        return newLabel
                                    })
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "5px",
                                }}
                            >
                                {getLabel(i)}
                                <Typography variant="caption">{`(Block ${i})`}</Typography>
                            </Box>
                        </Box>
                    )
                })}
            </Box>
            {selected === "Superblock" && (
                <SuperblockTabs data={data} progress={progress} />
            )}
            {selected === "Inode Bitmap" && (
                <BitmapTabs type="inode" data={data} progress={progress} />
            )}
            {selected === "Data Bitmap" && (
                <BitmapTabs type="data" data={data} progress={progress} />
            )}
            {selected.includes("Inode Block") && (
                <InodeBlockTabs
                    selectedInode={selectedInode}
                    setSelectedInode={setSelectedInode}
                    inodeBitmap={inodeBitmap}
                    setBlockNumber={setBlockNumber}
                    blockRefs={blockRefs}
                    canMove={canMove}
                    data={data}
                    progress={progress}
                    setSelected={setSelected}
                    beginOperation={beginOperation}
                    blockNumber={parseInt(selected.split(" ")[2])}
                />
            )}
            {selected.includes("Data Block") && (
                <DataBlockTabs
                    key={parseInt(selected.split(" ")[2])}
                    blockNumber={parseInt(selected.split(" ")[2])}
                    data={data}
                    setSelected={setSelected}
                    setBlockNumber={setBlockNumber}
                    setSelectedInode={setSelectedInode}
                    beginOperation={beginOperation}
                    blockRefs={blockRefs}
                    canMove={canMove}
                    progress={progress}
                />
            )}
        </Box>
    )
}

export default FileSystemBlockLayout

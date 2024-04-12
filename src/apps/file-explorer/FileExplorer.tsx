import { Box, Button, Paper, TextField, useTheme } from "@mui/material"
import HomeIcon from "@mui/icons-material/Home"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useAppSelector } from "../../redux/hooks/hooks"
import { selectIsDiskFormatted } from "../../redux/reducers/fileSystemSlice"
import WaitingMessage from "../common/components/WaitingMessage"
import { useEffect, useState } from "react"
import { DirectoryStructure, listing } from "../../apis/vsfs"
import FileView from "./components/FileView"
import ExplorerWindow from "./components/ExplorerWindow"
import { selectSectors } from "../../redux/reducers/diskSlice"

const FileExplorer = () => {
    const theme = useTheme()
    const isDiskFormatted = useAppSelector(selectIsDiskFormatted)
    const sectors = useAppSelector(selectSectors)
    const [currentDirectory, setCurrentDirectory] = useState("/")
    const [waiting, setWaiting] = useState<"path" | "tree" | "">("path")
    const [treeData, setTreeData] = useState<DirectoryStructure | null>(null)
    const [fileData, setFileData] = useState<DirectoryStructure | null>(null)

    useEffect(() => {
        const getData = async () => {
            setWaiting("tree")
            const data = await listing("/")
            setTreeData(data)
            setWaiting("")
        }
        if (isDiskFormatted) {
            getData()
        }
    }, [sectors, isDiskFormatted])

    useEffect(() => {
        const getData = async () => {
            setWaiting("path")
            const data = await listing(currentDirectory)
            setFileData(data)
            setWaiting("")
        }
        if (isDiskFormatted) {
            getData()
        }
    }, [sectors, isDiskFormatted, currentDirectory])

    const ExplorerHeader = () => {
        return (
            <Box sx={{ display: "flex", gap: theme.spacing(2) }}>
                <Button
                    onClick={() => {
                        setCurrentDirectory("/")
                    }}
                    disabled={!!waiting || currentDirectory === "/"}
                    variant="contained"
                    sx={{ py: theme.spacing(1) }}
                >
                    <HomeIcon />
                </Button>
                <TextField
                    sx={{ fontSize: "20px" }}
                    value={currentDirectory}
                    disabled
                    fullWidth
                />
                <Button
                    disabled={!!waiting || currentDirectory === "/"}
                    onClick={async () => {
                        setWaiting("path")
                        setCurrentDirectory((prevCurrentDirectory) => {
                            if (prevCurrentDirectory === "/") {
                                return prevCurrentDirectory
                            } else {
                                return (
                                    "/" +
                                    prevCurrentDirectory
                                        .split("/")
                                        .filter((v) => v)
                                        .slice(0, -1)
                                        .join("/")
                                )
                            }
                        })

                        setWaiting("")
                    }}
                    variant="contained"
                    sx={{ py: theme.spacing(1) }}
                >
                    <ArrowBackIcon />
                </Button>
            </Box>
        )
    }

    return (
        <Paper
            sx={{
                "&:hover, &:hover *": {
                    cursor:
                        waiting === "path" && isDiskFormatted
                            ? "wait"
                            : undefined,
                },
                height: "100%",
                width: "100%",
                padding: theme.spacing(4),
            }}
        >
            {!isDiskFormatted ||
            waiting === "tree" ||
            treeData === null ||
            fileData === null ? (
                <WaitingMessage
                    title="File Explorer"
                    message={
                        waiting
                            ? "Loading directory information..."
                            : "Waiting for Disk..."
                    }
                />
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.spacing(2),
                        height: "100%",
                        position: "relative",
                    }}
                >
                    <ExplorerHeader />
                    <Box
                        sx={{
                            display: "flex",
                            padding: theme.spacing(3),
                            border: "2px solid gray",
                            borderRadius: "5px",
                            height: "100%",
                        }}
                    >
                        <ExplorerWindow
                            setWaiting={setWaiting}
                            currentDirectory={currentDirectory}
                            setCurrentDirectory={setCurrentDirectory}
                            data={treeData!}
                            waiting={waiting}
                        />
                        <FileView
                            setWaiting={setWaiting}
                            data={fileData!}
                            setCurrentDirectory={setCurrentDirectory}
                            waiting={waiting}
                        />
                    </Box>
                </Box>
            )}
        </Paper>
    )
}

export default FileExplorer

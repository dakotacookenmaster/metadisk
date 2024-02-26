import { Box, Button, Paper, TextField, useTheme } from "@mui/material"
import HomeIcon from "@mui/icons-material/Home"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useAppSelector } from "../../redux/hooks/hooks"
import { selectIsDiskFormatted } from "../../redux/reducers/fileSystemSlice"
import WaitingMessage from "../common/components/WaitingMessage"
import ExplorerWindow from "./components/ExplorerWindow"
import { useState } from "react"
import { readDirectory } from "../../apis/vsfs"

const FileExplorer = () => {
    const theme = useTheme()
    const isDiskFormatted = useAppSelector(selectIsDiskFormatted)
    const [currentDirectory, setCurrentDirectory] = useState({
        dirName: "/",
        inode: 0,
    })

    const ExplorerHeader = (props: {
        currentDirectory: { dirName: string; inode: number }
    }) => {
        const { currentDirectory } = props
        return (
            <Box sx={{ display: "flex", gap: theme.spacing(2) }}>
                <Button
                    onClick={() => {
                        setCurrentDirectory({ dirName: "/", inode: 0 })
                    }}
                    variant="contained"
                    sx={{ py: theme.spacing(1) }}
                >
                    <HomeIcon />
                </Button>
                <TextField
                    sx={{ fontSize: "20px" }}
                    value={currentDirectory.dirName}
                    disabled
                    fullWidth
                />
                <Button
                    onClick={async () => {
                        const parent = (
                            await readDirectory(currentDirectory.inode)
                        ).entries.find((entry) => entry.name === "..")

                        if (parent) {
                            setCurrentDirectory((prevCurrentDirectory) => {
                                return {
                                    dirName: "/" + prevCurrentDirectory.dirName
                                        .split("/")
                                        .filter(v => v)
                                        .slice(-2, -1)
                                        .join("/"),
                                    inode: parent.inode,
                                }
                            })
                        }
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
            sx={{ height: "100%", width: "100%", padding: theme.spacing(4) }}
        >
            {!isDiskFormatted ? (
                <WaitingMessage
                    title="File Explorer"
                    message="Waiting for Disk..."
                />
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.spacing(2),
                        height: "100%",
                    }}
                >
                    <ExplorerHeader currentDirectory={currentDirectory} />
                    <ExplorerWindow
                        currentDirectory={currentDirectory}
                        setCurrentDirectory={setCurrentDirectory}
                    />
                </Box>
            )}
        </Paper>
    )
}

export default FileExplorer

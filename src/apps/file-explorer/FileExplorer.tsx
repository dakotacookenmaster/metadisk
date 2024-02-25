import { Box, Button, Paper, TextField, useTheme } from "@mui/material"
import HomeIcon from "@mui/icons-material/Home"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useAppSelector } from "../../redux/hooks/hooks"
import {
    selectIsDiskFormatted,
    selectPath,
} from "../../redux/reducers/fileSystemSlice"
import WaitingMessage from "../common/components/WaitingMessage"
import ExplorerWindow from "./components/ExplorerWindow"

const FileExplorer = () => {
    const theme = useTheme()
    const path = useAppSelector(selectPath)
    const isDiskFormatted = useAppSelector(selectIsDiskFormatted)

    const ExplorerHeader = () => {
        return (
            <Box sx={{ display: "flex", gap: theme.spacing(2) }}>
                <Button variant="contained" sx={{ py: theme.spacing(1) }}>
                    <HomeIcon />
                </Button>
                <TextField
                    sx={{ fontSize: "20px" }}
                    value={path}
                    disabled
                    fullWidth
                />
                <Button variant="contained" sx={{ py: theme.spacing(1) }}>
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: theme.spacing(2), height: "100%" }}>
                    <ExplorerHeader />
                    <ExplorerWindow />
                </Box>
            )}
        </Paper>
    )
}

export default FileExplorer

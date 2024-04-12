import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import { DirectoryStructure, rmdir } from "../../../apis/vsfs"
import { useAppDispatch } from "../../../redux/hooks/hooks"
import { setError } from "../../../redux/reducers/appSlice"
import FolderOpenIcon from "@mui/icons-material/FolderOpen"
import { useTheme } from "@mui/material"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import FileOpenIcon from '@mui/icons-material/FileOpen'

export default function RightClickContext(props: {
    contextMenu: {
        mouseX: number
        mouseY: number
        entry: DirectoryStructure
    } | null
    setContextMenu: React.Dispatch<
        React.SetStateAction<{
            mouseX: number
            mouseY: number
            entry: DirectoryStructure
        } | null>
    >
    setWaiting: React.Dispatch<React.SetStateAction<"" | "path" | "tree">>
}) {
    const { contextMenu, setContextMenu, setWaiting } = props
    const dispatch = useAppDispatch()
    const theme = useTheme()

    const handleOpen = () => {
        console.log("OPENING:", contextMenu!.entry.name)
    }

    const handleClose = () => {
        setContextMenu(null)
    }

    const handleDelete = async () => {
        if (contextMenu!.entry.type === "directory") {
            try {
                setContextMenu(null)
                setWaiting("path")
                await rmdir(contextMenu!.entry.path)
            } catch (error) {
                let e = error as Error
                dispatch(
                    setError({
                        name: e.name,
                        message: e.message,
                    }),
                )
                setWaiting("")
            }
        }
    }

    return (
        <Menu
            open={contextMenu !== null}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={
                contextMenu !== null
                    ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                    : undefined
            }
        >
            <MenuItem
                onClick={handleOpen}
                sx={{ display: "flex", gap: theme.spacing(1) }}
            >
                Open { contextMenu?.entry.type === "directory" ? <FolderOpenIcon sx={{ marginLeft: "auto" }} /> : <FileOpenIcon sx={{ marginLeft: "auto" }} /> }
            </MenuItem>
            <MenuItem sx={{ display: "flex", gap: theme.spacing(1) }} onClick={handleDelete}>
                Delete
                <DeleteOutlineIcon sx={{ marginLeft: "auto" }} />
            </MenuItem>
        </Menu>
    )
}

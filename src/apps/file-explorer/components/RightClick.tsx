import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import { useAppDispatch } from "../../../redux/hooks/hooks"
import { setOpenFile } from "../../../redux/reducers/fileSystemSlice"
import rmdir from "../../../apis/vsfs/posix/rmdir.vsfs"
import { setError } from "../../../redux/reducers/appSlice"
import unlink from "../../../apis/vsfs/posix/unlink.vsfs"
import FileOpenIcon from "@mui/icons-material/FileOpen"
import { useTheme } from "@mui/material"
import DeleteIcon from '@mui/icons-material/Delete'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FolderDeleteIcon from '@mui/icons-material/FolderDelete'
import { blue } from "@mui/material/colors"
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder'
import React from "react"

export default function RightClick(props: {
    contextMenu: {
        mouseX: number
        mouseY: number
        path: string
        type: "file" | "directory" | "window"
    } | null
    setCurrentDirectory: React.Dispatch<React.SetStateAction<string>>
    setContextMenu: React.Dispatch<
        React.SetStateAction<{
            mouseX: number
            mouseY: number
            path: string
            type: "file" | "directory" | "window"
        } | null>
    >
}) {
    const { contextMenu, setContextMenu, setCurrentDirectory } = props
    const dispatch = useAppDispatch()
    const theme = useTheme()

    const handleClose = () => {
        setContextMenu(null)
    }

    const handleOpen = () => {
        if (contextMenu) {
            handleClose()
            if (contextMenu.type === "directory") {
                setCurrentDirectory(contextMenu.path)
            } else if (contextMenu.type === "file") {
                dispatch(setOpenFile(contextMenu.path))
            } else {
                dispatch(
                    setError({
                        name: "Error",
                        message:
                            "You cannot call open from the window context.",
                    }),
                )
            }
        }
    }

    const handleDelete = async () => {
        if (contextMenu) {
            if (contextMenu.type === "directory") {
                handleClose()
                try {
                    await rmdir(contextMenu.path)
                } catch (error) {
                    let e = error as Error
                    dispatch(
                        setError({
                            name: e.name,
                            message: e.message,
                        }),
                    )
                }
            } else if (contextMenu.type === "file") {
                handleClose()
                try {
                    await unlink(contextMenu.path)
                } catch (error) {
                    let e = error as Error
                    dispatch(
                        setError({
                            name: e.name,
                            message: e.message,
                        }),
                    )
                }
            } else {
                dispatch(
                    setError({
                        name: "Error",
                        message:
                            "You cannot call unlink from the window context.",
                    }),
                )
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
            slotProps={{
                paper: {
                    sx: {
                        background: blue[600],
                    }
                }
            }}
        >
            {contextMenu !== null && contextMenu.type !== "window" && (
                <div>
                    <MenuItem onClick={handleOpen} sx={{ display: "flex", justifyContent: "space-between", gap: theme.spacing(1) }}>Open {
                        contextMenu.type === "file" ? <FileOpenIcon /> : <FolderOpenIcon />
                    }</MenuItem>
                    <MenuItem onClick={handleDelete} sx={{ display: "flex", justifyContent: "space-between", gap: theme.spacing(1) }}>Delete {
                        contextMenu.type === "file" ? <DeleteIcon /> : <FolderDeleteIcon />
                    }</MenuItem>
                </div>
            )}
            {contextMenu !== null && contextMenu.type === "window" && (
                <div>
                    <MenuItem onClick={handleOpen} sx={{ display: "flex", justifyContent: "space-between", gap: theme.spacing(1) }}>New File <NoteAddIcon /></MenuItem>
                    <MenuItem onClick={handleClose} sx={{ display: "flex", justifyContent: "space-between", gap: theme.spacing(1) }}>New Directory <CreateNewFolderIcon /></MenuItem>
                </div>
            )}
        </Menu>
    )
}

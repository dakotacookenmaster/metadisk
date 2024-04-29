import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import { useAppDispatch } from "../../../redux/hooks/hooks"
import { setOpenFile } from "../../../redux/reducers/fileSystemSlice"
import rmdir from "../../../apis/vsfs/posix/rmdir.vsfs"
import { setError } from "../../../redux/reducers/appSlice"
import unlink from "../../../apis/vsfs/posix/unlink.vsfs"

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

    const handleClose = () => {
        setContextMenu(null)
    }

    const handleOpen = () => {
        if (contextMenu) {
            handleClose()
            if (contextMenu.type === "directory") {
                setCurrentDirectory(contextMenu.path)
            } else if(contextMenu.type === "file") {
                dispatch(setOpenFile(contextMenu.path))
            } else {
                dispatch(setError({
                    name: "Error",
                    message: "You cannot call open from the window context."
                }))
            }
        }
    }

    const handleDelete = async () => {
        if(contextMenu) {
            if(contextMenu.type === "directory") {
                handleClose()
                try {
                    await rmdir(contextMenu.path)
                } catch(error) {
                    let e = error as Error
                    dispatch(setError({
                        name: e.name,
                        message: e.message,
                    }))
                }
            } else if(contextMenu.type === "file") {
                handleClose()
                try {
                    await unlink(contextMenu.path)
                } catch(error) {
                    let e = error as Error
                    dispatch(setError({
                        name: e.name,
                        message: e.message
                    }))
                }
            } else {
                dispatch(setError({
                    name: "Error",
                    message: "You cannot call unlink from the window context."
                }))
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
            {contextMenu !== null && contextMenu.type !== "window" && (
                <div>
                    <MenuItem onClick={handleOpen}>Open</MenuItem>
                    <MenuItem onClick={handleDelete}>Delete</MenuItem>
                </div>
            )}
            {contextMenu?.type === "window" && (
                <div>
                    <MenuItem onClick={handleOpen}>New File</MenuItem>
                    <MenuItem onClick={handleClose}>New Directory</MenuItem>
                </div>
            )}
        </Menu>
    )
}

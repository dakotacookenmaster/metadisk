import * as React from "react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import { TextField } from "@mui/material"
import open from "../../../apis/vsfs/posix/open.vsfs"
import OpenFlags from "../../../apis/enums/vsfs/OpenFlags.enum"
import Permissions from "../../../apis/enums/vsfs/Permissions.enum"
import { useAppDispatch } from "../../../redux/hooks/hooks"
import { setError } from "../../../redux/reducers/appSlice"
import mkdir from "../../../apis/vsfs/posix/mkdir.vsfs"

export default function FileOrDirectoryDialog(props: {
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    type: "file" | "directory"
    currentDirectory: string
}) {
    const { isOpen, setIsOpen, type, currentDirectory } = props
    const [name, setName] = React.useState("")
    const dispatch = useAppDispatch()

    const handleClose = async () => {
        setIsOpen(false)
        if (type === "file") {
            try {
                await open(
                    currentDirectory === "/"
                        ? currentDirectory + name
                        : currentDirectory + "/" + name,
                    [OpenFlags.O_CREAT, OpenFlags.O_RDWR],
                    Permissions.READ_WRITE_EXECUTE,
                )
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
            try {
                await mkdir(
                    currentDirectory === "/"
                        ? currentDirectory + name
                        : currentDirectory + "/" + name,
                )
            } catch (error) {
                let e = error as Error
                dispatch(
                    setError({
                        name: e.name,
                        message: e.message,
                    }),
                )
            }
        }
        setName("")
    }

    return (
        <React.Fragment>
            <Dialog
                open={isOpen}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                sx={{ width: "100%" }}
            >
                <DialogTitle id="alert-dialog-title">
                    Create a New {type === "file" ? "File" : "Directory"}
                </DialogTitle>
                <DialogContent sx={{ minWidth: "300px" }}>
                    <TextField
                        value={name}
                        fullWidth
                        onChange={(event) => {
                            const { value } = event.target
                            setName(value)
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setIsOpen(false)
                            setName("")
                        }}
                        autoFocus
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleClose} autoFocus>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}

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
import { getCharacter, getCharacterEncoding } from "../../vsfs/components/Viewers"
import { v4 as uuid } from "uuid"

export default function FileOrDirectoryDialog(props: {
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    setLoadingHierarchy: React.Dispatch<React.SetStateAction<string[]>>
    type: "file" | "directory"
    currentDirectory: string
}) {
    const { isOpen, setIsOpen, type, currentDirectory, setLoadingHierarchy } =
        props
    const [name, setName] = React.useState("")
    const dispatch = useAppDispatch()

    const handleClose = async () => {
        setIsOpen(false)
        if (type === "file") {
            const task = uuid()
            try {
                setLoadingHierarchy(prevLoadingHierarchy => [...prevLoadingHierarchy, task])
                await open(
                    currentDirectory === "/"
                        ? currentDirectory + name
                        : currentDirectory + "/" + name,
                    [OpenFlags.O_CREAT, OpenFlags.O_RDWR],
                    Permissions.READ_WRITE_EXECUTE,
                )
                setLoadingHierarchy(prevLoadingHierarchy => prevLoadingHierarchy.filter(id => id !== task))
            } catch (error) {
                let e = error as Error
                dispatch(
                    setError({
                        name: e.name,
                        message: e.message,
                    }),
                )
                setLoadingHierarchy(prevLoadingHierarchy => prevLoadingHierarchy.filter(id => id !== task))
            }
        } else {
            const task = uuid()
            try {
                setLoadingHierarchy(prevLoadingHierarchy => [...prevLoadingHierarchy, task])
                await mkdir(
                    currentDirectory === "/"
                        ? currentDirectory + name
                        : currentDirectory + "/" + name,
                )
                setLoadingHierarchy(prevLoadingHierarchy => prevLoadingHierarchy.filter(id => id !== task))
            } catch (error) {
                let e = error as Error
                dispatch(
                    setError({
                        name: e.name,
                        message: e.message,
                    }),
                )
                setLoadingHierarchy(prevLoadingHierarchy => prevLoadingHierarchy.filter(id => id !== task))
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
                            const codifiedName = value.split("").map((char) => {
                                const encoding = getCharacterEncoding(char)
                                if(encoding === -1) {
                                    return "?"
                                } else {
                                    return getCharacter(encoding)
                                }
                            }).join('')
                            setName(codifiedName)
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

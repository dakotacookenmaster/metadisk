import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import { OpenFlags, Permissions, mkdir } from "../../../apis/vsfs"
import { ChangeEvent, useState } from "react"
import React from "react"
import { useAppDispatch } from "../../../redux/hooks/hooks"
import { setError } from "../../../redux/reducers/appSlice"
import { TextField, useTheme } from "@mui/material"
import { open } from "../../../apis/vsfs"

export default function CreateFileOrDirectory(props: {
    open: null | { type: "file" | "directory"; path: string }
    setWaiting: React.Dispatch<React.SetStateAction<"" | "path" | "tree">>
    setOpen: React.Dispatch<
        React.SetStateAction<null | {
            type: "file" | "directory"
            path: string
        }>
    >
}) {
    const { open: isOpen, setOpen, setWaiting } = props
    const dispatch = useAppDispatch()
    const theme = useTheme()
    const [data, setData] = useState({
        name: "",
        permissionLevel: Permissions.ReadWriteExecute,
    })

    const handleClose = async () => {
        if (isOpen!.path.length === 0 || isOpen!.path.length > 13) {
            let error = new Error("Name must be between 0 and 13 characters.")
            dispatch(
                setError({
                    message: error.message,
                    name: error.name,
                }),
            )
        }
        if (isOpen!.type === "file") {
            setOpen(null)
            setWaiting("path")
            await open(
                `${isOpen!.path === "/" ? "" : isOpen!.path}/${data.name}`,
                [OpenFlags.O_CREAT, OpenFlags.O_RDWR],
                data.permissionLevel,
            )
        } else {
            setOpen(null)
            setWaiting("path")
            await mkdir(
                `${isOpen!.path === "/" ? "" : isOpen!.path}/${data.name}`,
                Permissions.ReadWrite,
            )
        }
    }

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target
        setData((prevData) => ({
            ...prevData,
            [name]: value,
        }))
    }

    if (isOpen !== null) {
        return (
            <React.Fragment>
                <Dialog
                    open={isOpen !== null}
                    onClose={handleClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    sx={{ width: "100%" }}
                    // onKeyDown={(event) => {
                    //     if(event.key === "Enter") {
                    //         handleClose()
                    //     }
                    // }}
                >
                    <DialogTitle id="alert-dialog-title">
                        {`Create New ${isOpen.type[0].toUpperCase()}${isOpen.type.slice(
                            1,
                        )}`}
                    </DialogTitle>
                    <DialogContent sx={{ minWidth: "500px" }}>
                        <TextField
                            fullWidth
                            sx={{ marginTop: "5px" }}
                            label="Name"
                            name="name"
                            onChange={handleChange}
                            autoFocus
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: theme.spacing(3), pb: theme.spacing(3) }}>
                        <Button
                            variant="contained"
                            onClick={handleClose}
                            autoFocus
                        >
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
            </React.Fragment>
        )
    }
}

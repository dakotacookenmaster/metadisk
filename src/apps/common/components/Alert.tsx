import * as React from "react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import { useAppDispatch, useAppSelector } from "../../../redux/hooks/hooks"
import { selectError, setError } from "../../../redux/reducers/appSlice"

export default function Alert() {
    const error = useAppSelector(selectError)
    const dispatch = useAppDispatch()

    const handleClose = () => {
        dispatch(setError(undefined))
    }

    return (
        <React.Fragment>
            <Dialog
                open={!!error}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    { error?.name }
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        { error?.message }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={handleClose} autoFocus>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}

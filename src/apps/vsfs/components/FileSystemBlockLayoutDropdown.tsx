import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import EditIcon from "@mui/icons-material/Edit"
import { Box, useTheme } from "@mui/material"
import { useAppDispatch } from "../../../redux/hooks/hooks"
import { setIsFinishedConfiguringFileSystem } from "../../../redux/reducers/fileSystemSlice"

export default function FileSystemBlockLayoutDropdown(props: {
    anchorEl: HTMLElement | null
    setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>
}) {
    const { anchorEl, setAnchorEl } = props
    const open = Boolean(anchorEl)
    const handleClose = () => {
        setAnchorEl(null)
    }
    const theme = useTheme()
    const dispatch = useAppDispatch()

    return (
        <div>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    "aria-labelledby": "basic-button",
                }}
            >
                <MenuItem onClick={() => {
                    dispatch(setIsFinishedConfiguringFileSystem(false))
                }}>
                    <Box sx={{ display: "flex", gap: theme.spacing(1) }}>
                        <EditIcon />
                        Edit File System
                    </Box>
                </MenuItem>
            </Menu>
        </div>
    )
}

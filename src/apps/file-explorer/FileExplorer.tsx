import {
    Box,
    Button,
    Paper,
    TextField,
    Typography,
    useTheme,
} from "@mui/material"
import HomeIcon from "@mui/icons-material/Home"
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks"
import {
    selectIsDiskFormatted,
    setOpenFile,
} from "../../redux/reducers/fileSystemSlice"
import FileHierarchy from "../common/interfaces/FileHierarchy.interface"
import getFileHierarchy from "../common/helpers/getFileHierarchy"
import FileIcon from "@mui/icons-material/Description"
import FolderIcon from "@mui/icons-material/Folder"
import Tooltip from "../common/components/Tooltip"
import WaitingMessage from "../common/components/WaitingMessage"
import RightClick from "./components/RightClick"
import { selectSectors } from "../../redux/reducers/diskSlice"

export default function FileExplorer() {
    const theme = useTheme()
    const [currentDirectory, setCurrentDirectory] = useState("/")
    const isDiskFormatted = useAppSelector(selectIsDiskFormatted)
    const [hierarchy, setHierarchy] = useState<FileHierarchy | null>(null)
    const [contextMenu, setContextMenu] = useState<null | {
        mouseX: number
        mouseY: number
        path: string
        type: "file" | "directory" | "window"
    }>(null)
    const dispatch = useAppDispatch()
    const sectors = useAppSelector(selectSectors)

    const handleContextMenu = (
        event: any,
        path: string,
        type: "file" | "directory" | "window",
    ) => {
        event.preventDefault()
        event.stopPropagation()
        setContextMenu(
            contextMenu === null
                ? {
                      mouseX: event.clientX + 2,
                      mouseY: event.clientY - 6,
                      path,
                      type,
                  }
                : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                  // Other native context menus might behave different.
                  // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                  null,
        )
    }

    useEffect(() => {
        ;(async () => {
            if (isDiskFormatted) {
                setHierarchy(null)
                const data = await getFileHierarchy({
                    inode: 0,
                    pathname: currentDirectory,
                    type: "directory",
                    children: [],
                })
                setHierarchy(data)
            }
        })()
    }, [currentDirectory, isDiskFormatted, sectors])
    return (
        <Paper
            sx={{
                height: "100%",
                width: "100%",
                padding: theme.spacing(2),
                "&:hover": {
                    cursor: !hierarchy && isDiskFormatted ? "wait" : "default",
                },
            }}
        >
            <Typography
                variant="h5"
                sx={{
                    paddingTop: "5px",
                    paddingBottom: "10px",
                    textAlign: "center",
                }}
            >
                File Explorer
            </Typography>
            {!hierarchy && !isDiskFormatted ? (
                <WaitingMessage message="Loading File Explorer..." />
            ) : (
                <>
                    <Box
                        sx={{
                            display: "flex",
                            gap: theme.spacing(1),
                            marginBottom: theme.spacing(1.5),
                        }}
                    >
                        <Button
                            variant="contained"
                            disabled={currentDirectory === "/"}
                            onClick={() => {
                                setCurrentDirectory("/")
                            }}
                        >
                            <HomeIcon />
                        </Button>
                        <TextField
                            disabled
                            value={currentDirectory}
                            fullWidth
                        />
                        <Button
                            variant="contained"
                            disabled={currentDirectory === "/"}
                            onClick={() => {
                                setCurrentDirectory((prevCurrentDirectory) => {
                                    return (
                                        "/" +
                                        prevCurrentDirectory
                                            .split("/")
                                            .filter((v) => v)
                                            .slice(0, -1)
                                            .join("/")
                                    )
                                })
                            }}
                        >
                            <KeyboardBackspaceIcon />
                        </Button>
                    </Box>
                    <Box
                        sx={{
                            border: "1px solid #4f4f4f",
                            width: "100%",
                            height: "540px",
                            borderRadius: "5px",
                            padding: theme.spacing(1.5),
                            display: "flex",
                        }}
                        onContextMenu={(event) =>
                            handleContextMenu(event, currentDirectory, "window")
                        }
                    >
                        <Box
                            sx={{
                                width: "200px",
                                borderRight: "2px solid #4f4f4f",
                                height: "100%",
                            }}
                        ></Box>
                        <Box
                            sx={{
                                width: "100%",
                                height: "100%",
                                px: theme.spacing(1.5),
                                display: "flex",
                                flexWrap: "wrap",
                                gap: theme.spacing(1),
                            }}
                        >
                            {hierarchy?.children
                                .sort(
                                    (a, b) =>
                                        -a.pathname.split("/")[0] ||
                                        +b.pathname.split("/")[0],
                                )
                                .map((child, index) => {
                                    const name = child.pathname
                                        .split("/")
                                        .splice(-1)[0]
                                    return (
                                        <Tooltip
                                            placement="top"
                                            title={name}
                                            key={`entry-${index}`}
                                        >
                                            <Box
                                                sx={{
                                                    userSelect: "none",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    flexDirection: "column",
                                                    width: "100px",
                                                    height: "100px",
                                                    border: "2px solid #4f4f4f",
                                                    borderRadius: "5px",
                                                    "&:hover": {
                                                        cursor: "pointer",
                                                    },
                                                }}
                                                onContextMenu={(event) =>
                                                    handleContextMenu(
                                                        event,
                                                        child.pathname,
                                                        child.type,
                                                    )
                                                }
                                                onDoubleClick={() => {
                                                    if (
                                                        child.type ===
                                                        "directory"
                                                    ) {
                                                        setCurrentDirectory(
                                                            child.pathname,
                                                        )
                                                    } else {
                                                        dispatch(
                                                            setOpenFile(
                                                                child.pathname,
                                                            ),
                                                        )
                                                    }
                                                }}
                                            >
                                                {child.type === "file" ? (
                                                    <FileIcon />
                                                ) : (
                                                    <FolderIcon />
                                                )}
                                                <Typography
                                                    sx={{
                                                        width: "75px",
                                                        textOverflow:
                                                            "ellipsis",
                                                        overflow: "hidden",
                                                        whiteSpace: "nowrap",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {name}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    )
                                })}
                        </Box>
                    </Box>
                </>
            )}
            <RightClick
                setCurrentDirectory={setCurrentDirectory}
                contextMenu={contextMenu}
                setContextMenu={setContextMenu}
            />
        </Paper>
    )
}

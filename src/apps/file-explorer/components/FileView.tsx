import { DirectoryStructure } from "../../../apis/vsfs"
import { Box, useTheme } from "@mui/material"
import FolderIcon from "@mui/icons-material/Folder"
import FileIcon from "@mui/icons-material/Description"
import { blue } from "@mui/material/colors"
import React, { useState } from "react"
import RightClickContext from "./RightClickContext"

const FileView = (props: {
    setCurrentDirectory: React.Dispatch<React.SetStateAction<string>>
    data: DirectoryStructure
    waiting: "path" | "tree" | ""
    setWaiting: React.Dispatch<React.SetStateAction<"" | "path" | "tree">>
}) => {
    const { setCurrentDirectory, data, waiting, setWaiting } = props
    const [contextMenu, setContextMenu] = useState<null | {
        mouseX: number
        mouseY: number
        entry: DirectoryStructure
    }>(null)

    const handleContextMenu = (event: any, entry: DirectoryStructure) => {
        if (!waiting) {
            event.preventDefault()
            setContextMenu(
                contextMenu === null
                    ? {
                          mouseX: event.clientX + 2,
                          mouseY: event.clientY - 6,
                          entry,
                      }
                    : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                      // Other native context menus might behave different.
                      // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                      null,
            )
        }
    }

    const theme = useTheme()
    const entries = data.children!

    return (
        <Box
            sx={{
                display: "flex",
                px: theme.spacing(3),
                flexWrap: "wrap",
                overflow: "auto",
                maxHeight: "450px",
                scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                scrollbarWidth: "thin",
                width: "100%",
                flex: 1,
                gap: theme.spacing(3),
                alignContent: "flex-start",
            }}
        >
            <RightClickContext
                setWaiting={setWaiting}
                contextMenu={contextMenu}
                setContextMenu={setContextMenu}
            />
            {[...entries]
                .filter((entry) => entry.name !== ".." && entry.name !== ".")
                .sort(
                    (entry1, entry2) =>
                        -(entry1.name < entry2.name) ||
                        +(entry1.name > entry2.name),
                )
                .map((entry, index) => {
                    return (
                        <React.Fragment
                            key={`entry-${index}-${entry.name}-${entry.inode}`}
                        >
                            <Box
                                onContextMenu={(event) =>
                                    handleContextMenu(event, entry)
                                }
                                onDoubleClick={async () => {
                                    if (!waiting) {
                                        if (entry.type === "directory") {
                                            setCurrentDirectory(
                                                (prevCurrentDirectory) => {
                                                    return `${
                                                        prevCurrentDirectory ===
                                                        "/"
                                                            ? ""
                                                            : prevCurrentDirectory
                                                    }/${entry.name}`
                                                },
                                            )
                                        }
                                    }
                                }}
                                sx={{
                                    userSelect: "none",
                                    alignSelf: "flex-start",
                                    display: "flex",
                                    flexDirection: "column",
                                    textAlign: "center",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100px",
                                    minWidth: "100px",
                                    height: "100px",
                                    border: "2px solid gray",
                                    borderRadius: "8px",
                                    "&:hover": {
                                        cursor:
                                            waiting === "path"
                                                ? "wait"
                                                : "pointer",
                                    },
                                }}
                            >
                                {entry.type === "file" ? (
                                    <FileIcon />
                                ) : (
                                    <FolderIcon />
                                )}
                                {entry.name}
                            </Box>
                        </React.Fragment>
                    )
                })}
        </Box>
    )
}

export default FileView

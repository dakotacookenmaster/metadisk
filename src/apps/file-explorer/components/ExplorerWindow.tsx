import { NodeRendererProps, Tree } from "react-arborist"
import { DirectoryStructure } from "../../../apis/vsfs"
import {
    NoteAdd,
    CreateNewFolder,
    Description,
    Folder,
} from "@mui/icons-material"
import { Box, IconButton, useTheme } from "@mui/material"
import { useState } from "react"
import CreateFileOrDirectory from "./CreateFileOrDirectory"

const ExplorerWindow = (props: {
    data: DirectoryStructure
    setCurrentDirectory: React.Dispatch<React.SetStateAction<string>>
    setWaiting: React.Dispatch<React.SetStateAction<"" | "path" | "tree">>
    currentDirectory: string
    waiting: "path" | "tree" | ""
}) => {
    const { data, setCurrentDirectory, waiting, currentDirectory, setWaiting } = props
    const theme = useTheme()
    const [open, setOpen] = useState<null | {
        type: "file" | "directory"
        path: string
    }>(null)

    const Node = (
        props: NodeRendererProps<{
            id: string
            name: string
            path: string
            inode: number
            children: DirectoryStructure[] | undefined
        }>,
    ) => {
        /* This node instance can do many things. See the API reference. */
        const { style, dragHandle, node } = props
        const theme = useTheme()

        const handleClick = () => {
            node.isOpen ? node.close() : node.open()
        }

        const handleDoubleClick = () => {
            if (!waiting) {
                setCurrentDirectory(node.data.path)
            }
        }

        return (
            <Box
                onClick={handleClick}
                sx={{
                    "&:hover": {
                        cursor: waiting === "path" ? "wait" : "pointer",
                    },
                    display: "flex",
                    gap: theme.spacing(1),
                    alignItems: "center",
                    width: "100%",
                }}
                style={style}
                ref={dragHandle}
                onDoubleClick={handleDoubleClick}
            >
                {node.isLeaf ? <Description /> : <Folder />}
                {node.data.name}
            </Box>
        )
    }

    return (
        <>
            <CreateFileOrDirectory setWaiting={setWaiting} open={open} setOpen={setOpen} />
            <Box
                sx={{
                    borderRight: "3px solid gray",
                    width: "200px",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <Tree
                    data={[
                        {
                            id: data.id,
                            name: data.name,
                            path: data.path,
                            inode: data.inode,
                            children: data.children
                                ? [...data.children].sort(
                                      (childA, childB) =>
                                          -(childA.name < childB.name) ||
                                          +(childA.name > childB.name),
                                  )
                                : undefined,
                        },
                    ]}
                    disableDrag
                    disableDrop
                >
                    {Node}
                </Tree>
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        width: "100%",
                        height: "max-content",
                        marginTop: "auto",
                        display: "flex",
                        justifyContent: "right",
                        px: theme.spacing(2),
                    }}
                >
                    <IconButton
                        onClick={() =>
                            setOpen({ type: "file", path: currentDirectory })
                        }
                    >
                        <NoteAdd sx={{ fontSize: "40px" }} />
                    </IconButton>
                    <IconButton
                        onClick={() =>
                            setOpen({
                                type: "directory",
                                path: currentDirectory,
                            })
                        }
                    >
                        <CreateNewFolder sx={{ fontSize: "40px" }} />
                    </IconButton>
                </Box>
            </Box>
        </>
    )
}

export default ExplorerWindow

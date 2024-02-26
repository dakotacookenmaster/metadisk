import { ChevronRight, ExpandMore } from "@mui/icons-material"
import { Box, useTheme } from "@mui/material"
import { TreeItem, TreeView } from "@mui/x-tree-view"
import { DirectoryStructure, listing } from "../../../apis/vsfs"
import { useEffect, useState } from "react"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectSectors } from "../../../redux/reducers/diskSlice"
import FileIcon from "@mui/icons-material/Description"
import FolderIcon from "@mui/icons-material/Folder"

const ExplorerWindow = (props: {
    currentDirectory: { dirName: string; inode: number }
    setCurrentDirectory: React.Dispatch<
        React.SetStateAction<{
            dirName: string
            inode: number
        }>
    >
}) => {
    const { currentDirectory, setCurrentDirectory } = props
    const theme = useTheme()
    const [directory, setDirectory] = useState<DirectoryStructure | undefined>(
        undefined,
    )

    const sectors = useAppSelector(selectSectors)
    const [nodes, setNodes] = useState<string[]>([])

    const getNodes = (directory: DirectoryStructure, nodes: string[] = []) => {
        const result = [...nodes, nodes.slice(-1).join("") + directory.name]

        for (let child of directory.children) {
            result.push(
                ...getNodes(child, nodes).map(
                    (value) => directory.name + value,
                ),
            )
        }

        return result
    }

    const generateTreeStructure = (
        directory: DirectoryStructure,
        parent: string = "",
    ) => {
        return (
            <TreeItem
                key={`node-${parent}${directory.name}`}
                sx={{ userSelect: "none" }}
                nodeId={`${parent}${directory.name}`}
                label={directory.name}
                icon={directory.type === "file" ? <FileIcon /> : <FolderIcon />}
                onClick={() => {
                    setNodes((prevNodes) => {
                        const alreadyThere = prevNodes.find(
                            (node) => node === `${parent}${directory.name}`,
                        )
                        if (alreadyThere) {
                            return [...prevNodes].filter(
                                (node) => node !== `${parent}${directory.name}`,
                            )
                        } else {
                            return [...prevNodes, `${parent}${directory.name}`]
                        }
                    })
                }}
                onDoubleClick={(event) => {
                    event.stopPropagation()
                    if (directory.type === "directory") {
                        setCurrentDirectory({
                            dirName: `${parent === "/" ? "" : parent}/${directory.name === "/" ? "" : directory.name}`,
                            inode: directory.inode,
                        })
                    }
                }}
            >
                {directory.children.map((child) => {
                    return generateTreeStructure(child, parent + directory.name)
                })}
            </TreeItem>
        )
    }

    useEffect(() => {
        const getDirectoryTree = async () => {
            const result = await listing(
                currentDirectory.inode,
                currentDirectory.dirName,
            ) // get the listing for the root directory
            setNodes(getNodes(result))
            setDirectory(result)
        }
        getDirectoryTree()
    }, [sectors])

    return (
        <Box
            sx={{
                border: "1px solid rgb(255, 255, 255, 0.5)",
                height: "100%",
                borderRadius: "5px",
                padding: theme.spacing(2),
            }}
        >
            {directory !== undefined && (
                <TreeView
                    aria-label="file system navigator"
                    expanded={nodes}
                    defaultCollapseIcon={<ExpandMore />}
                    defaultExpandIcon={<ChevronRight />}
                    sx={{ height: "100%", width: "300px" }}
                >
                    {generateTreeStructure(directory)}
                </TreeView>
            )}
        </Box>
    )
}

export default ExplorerWindow

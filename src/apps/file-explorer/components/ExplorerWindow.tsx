import { NodeRendererProps, Tree } from "react-arborist"
import { DirectoryStructure } from "../../../apis/vsfs"
import { Description, Folder } from "@mui/icons-material"
import { Box, useTheme } from "@mui/material"

const ExplorerWindow = (props: {
    data: DirectoryStructure
    setCurrentDirectory: React.Dispatch<
        React.SetStateAction<string>
    >
    waiting: "path" | "tree" | ""
}) => {
    const { data, setCurrentDirectory, waiting } = props

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
                    "&:hover": { cursor: waiting ? "wait" : "pointer" },
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
        <Box
            sx={{
                borderRight: "3px solid gray",
                width: "200px",
                overflow: "hidden",
            }}
        >
            <Tree
                data={[
                    {
                        id: data.id,
                        name: data.name,
                        path: data.path,
                        inode: data.inode,
                        children: data.children ? [...data.children].sort((childA, childB) => -(childA.name < childB.name) || +(childA.name > childB.name)) : undefined,
                    },
                ]}
                disableDrag
                disableDrop
            >
                {Node}
            </Tree>
        </Box>
    )
}

export default ExplorerWindow

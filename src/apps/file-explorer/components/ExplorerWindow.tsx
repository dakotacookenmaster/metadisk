import { ChevronRight, ExpandMore } from "@mui/icons-material"
import { Box, useTheme } from "@mui/material"
import { TreeItem, TreeView } from "@mui/x-tree-view"

const ExplorerWindow = () => {
    const theme = useTheme()
    return (
        <Box sx={{ border: "1px solid rgb(255, 255, 255, 0.5)", height: "100%", borderRadius: "5px", padding: theme.spacing(2) }}>
            <TreeView
                aria-label="file system navigator"
                defaultCollapseIcon={<ExpandMore />}
                defaultExpandIcon={<ChevronRight />}
                sx={{ height: "100%", width: "300px" }}
            >
                <TreeItem nodeId="1" label="Applications">
                    <TreeItem nodeId="2" label="Calendar" />
                </TreeItem>
                <TreeItem nodeId="5" label="Documents">
                    <TreeItem nodeId="10" label="OSS" />
                    <TreeItem nodeId="6" label="MUI">
                        <TreeItem nodeId="8" label="index.js" />
                    </TreeItem>
                </TreeItem>
            </TreeView>
        </Box>
    )
}

export default ExplorerWindow

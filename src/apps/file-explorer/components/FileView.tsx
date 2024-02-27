import { DirectoryStructure } from "../../../apis/vsfs"
import { Box, useTheme } from "@mui/material"
import FolderIcon from "@mui/icons-material/Folder"
import FileIcon from "@mui/icons-material/Description"
import { blue } from "@mui/material/colors"

const FileView = (props: {
    setCurrentDirectory: React.Dispatch<React.SetStateAction<string>>
    data: DirectoryStructure
    waiting: "path" | "tree" | ""
}) => {
    const { setCurrentDirectory, data, waiting } = props

    const theme = useTheme()
    const entries = data.children!

    return (
        <Box
            sx={{
                display: "flex",
                px: theme.spacing(3),
                flexWrap: "wrap",
                overflow: "auto",
                maxHeight: "400px",
                scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                scrollbarWidth: "thin",
                width: "100%",
                flex: 1,
                gap: theme.spacing(3),
                alignContent: "flex-start",
            }}
        >
            {[...entries]
                .filter((entry) => entry.name !== ".." && entry.name !== ".")
                .sort((entry1, entry2) => -(entry1.name < entry2.name) || +(entry1.name > entry2.name))
                .map((entry, index) => {
                    return (
                        <Box
                            key={`entry-${index}`}
                            onDoubleClick={async () => {
                                if (!waiting) {
                                    if (entry.type === "directory") {
                                        setCurrentDirectory(
                                            (prevCurrentDirectory) => {
                                                return `${
                                                    prevCurrentDirectory === "/"
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
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100px",
                                minWidth: "100px",
                                height: "100px",
                                border: "2px solid gray",
                                borderRadius: "8px",
                                "&:hover": {
                                    cursor: waiting ? "wait" : "pointer",
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
                    )
                })}
        </Box>
    )
}

export default FileView

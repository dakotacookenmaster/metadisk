import { useEffect, useState } from "react"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectSectors } from "../../../redux/reducers/diskSlice"
import { readDirectory, readInode } from "../../../apis/vsfs"
import { Box, useTheme } from "@mui/material"
import FolderIcon from "@mui/icons-material/Folder"
import FileIcon from "@mui/icons-material/Description"
import { blue } from "@mui/material/colors"
import WaitingMessage from "../../common/components/WaitingMessage"

const FileView = (props: {
    currentDirectory: { dirName: string; inode: number }
    setCurrentDirectory: React.Dispatch<
        React.SetStateAction<{
            dirName: string
            inode: number
        }>
    >
}) => {
    const { currentDirectory, setCurrentDirectory } = props
    const sectors = useAppSelector(selectSectors)
    const [entries, setEntries] = useState<
        { name: string; type: "file" | "directory"; inode: number }[]
    >([])
    const theme = useTheme()
    const [selected, setSelected] = useState<string | null>(null)
    const [waiting, setWaiting] = useState(false)

    useEffect(() => {
        const getDirectory = async () => {
            setWaiting(true)
            const rawEntries = (await readDirectory(currentDirectory.inode))
                .entries
            const entries = await Promise.all(
                rawEntries.map(async (entry) => ({
                    name: entry.name,
                    type: (await readInode(entry.inode)).type,
                    inode: entry.inode,
                })),
            )
            setEntries(entries)
            setWaiting(false)
        }
        getDirectory()
        setSelected(null)
    }, [sectors, currentDirectory])

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
                flex: 1,
                gap: theme.spacing(3),
                alignContent: "flex-start",
            }}
        >
            { waiting && <WaitingMessage message="Waiting for directory information..." />}
            {!waiting && entries
                .filter((entry) => entry.name !== ".." && entry.name !== ".")
                .map((entry, index) => {
                    return (
                        <Box
                            key={`entry-${index}`}
                            onClick={() => {
                                setSelected(entry.name)
                            }}
                            onDoubleClick={async () => {
                                if (parent && entry.type === "directory") {
                                    setCurrentDirectory(
                                        (prevCurrentDirectory) => ({
                                            dirName: `${
                                                prevCurrentDirectory.dirName ===
                                                "/"
                                                    ? ""
                                                    : prevCurrentDirectory.dirName
                                            }/${entry.name}`,
                                            inode: entry.inode,
                                        }),
                                    )
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
                                height: "100px",
                                border: "2px solid gray",
                                borderRadius: "8px",
                                background:
                                    selected === entry.name
                                        ? "gray"
                                        : undefined,
                                "&:hover": {
                                    cursor: "pointer",
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

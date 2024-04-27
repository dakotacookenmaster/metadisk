import {
    Box,
    Button,
    Paper,
    TextareaAutosize,
    Typography,
    useTheme,
} from "@mui/material"
import { useEffect, useState } from "react"
import { getCharacter, getCharacterEncoding } from "../vsfs/components/Viewers"
import { useAppSelector } from "../../redux/hooks/hooks"
import { selectFileDescriptorTable } from "../../redux/reducers/fileSystemSlice"
import Tooltip from "../common/components/Tooltip"

const Editor = () => {
    const theme = useTheme()
    const [saved, setSaved] = useState(true)
    const [openFile, setOpenFile] = useState("")
    const [fileData, setFileData] = useState("")
    const [loading, setLoading] = useState(false)

    // useEffect(() => {
    //     setTimeout(() => {
    //         setOpenFile("/abc/file.txt")
    //     }, 3000)
    // }, [])

    useEffect(() => {
        ;(async () => {
            if (openFile) {
                setLoading(true)
                // FIXME! I need to implement read()
                await new Promise((resolve) =>
                    setTimeout(() => resolve(true), 2000),
                )
                setFileData("This is the pretend file data that I've opened!")
                setLoading(false)
            }
        })()
    }, [openFile])

    useEffect(() => {
        setSaved(false)
    }, [fileData])

    const handleSave = () => {
        // do other logic here
        setSaved(true)
    }

    return (
        <Paper
            sx={{
                pt: theme.spacing(1.3),
                pb: theme.spacing(2),
                px: theme.spacing(2),
                height: "100%",
                flexGrow: 1,
                flexBasis: "50%",
            }}
        >
            <Typography
                variant="h5"
                sx={{ textAlign: "center", paddingBottom: "5px" }}
            >
                Text Editor{" "}
                {openFile ? (
                    <Tooltip placement="top" title={openFile}>
                        <span style={{ fontFamily: "monospace" }}>{`(${openFile
                            .split("/")
                            .splice(-1)})`}</span>
                    </Tooltip>
                ) : (
                    ""
                )}
            </Typography>
            <hr style={{ color: "gray", marginBottom: "25px" }} />
            {openFile && !loading && (
                <TextareaAutosize
                    value={fileData}
                    onChange={(event) => {
                        const { value } = event.target
                        let newValue = ""
                        for (let char of value) {
                            if (char === "\n") {
                                newValue += "\n"
                            } else {
                                let encoding = getCharacterEncoding(char)
                                if (encoding === -1) {
                                    newValue += "?"
                                } else {
                                    newValue += getCharacter(encoding)
                                }
                            }
                        }
                        setFileData(newValue)
                    }}
                    style={{
                        resize: "none",
                        height: "490px",
                        boxSizing: "border-box",
                        padding: "10px",
                        width: "100%",
                        fontFamily: "u0000",
                        fontSize: "20px",
                        border: "none",
                        outline: "none",
                        caretColor: "white",
                        backgroundColor: "#2f2f2f",
                        color: "white",
                        borderRadius: "3px",
                    }}
                />
            )}
            {(!openFile || loading) && (
                <Box
                    sx={{
                        height: "530px",
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        display: "flex",
                    }}
                >
                    <Typography variant="h5">
                        {!openFile ? (
                            "No File Selected"
                        ) : (
                            <span>
                                Loading{" "}
                                <span
                                    style={{ fontFamily: "monospace" }}
                                >{`${openFile.split("/").slice(-1)}`}</span>
                            </span>
                        )}
                    </Typography>
                </Box>
            )}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "right",
                    paddingTop: "10px",
                }}
            >
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saved}
                    sx={{
                        display: openFile && !loading ? "block" : "none",
                    }}
                >
                    Save
                </Button>
            </Box>
        </Paper>
    )
}

export default Editor

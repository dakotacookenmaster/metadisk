import { Box, Button, Paper, Typography, useTheme } from "@mui/material"
import { useEffect, useRef, useState } from "react"
import { getCharacter, getCharacterEncoding } from "../vsfs/components/Viewers"
import Tooltip from "../common/components/Tooltip"
import open from "../../apis/vsfs/posix/open.vsfs"
import OpenFlags from "../../apis/enums/vsfs/OpenFlags.enum"
import read from "../../apis/vsfs/posix/read.vsfs"
import write from "../../apis/vsfs/posix/write.vsfs"
import convertBinaryStringToText from "../common/helpers/convertBinaryStringToText"
import convertTextToBinaryString from "../common/helpers/convertTextToBinaryString"
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks"
import { setError } from "../../redux/reducers/appSlice"
import close from "../../apis/vsfs/posix/close.vsfs"
import { selectOpenFile, setOpenFile } from "../../redux/reducers/fileSystemSlice"
import { blue } from "@mui/material/colors"

const Editor = () => {
    const theme = useTheme()
    const [saved, setSaved] = useState(true)
    const openFile = useAppSelector(selectOpenFile)
    const [fileData, setFileData] = useState("")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const dispatch = useAppDispatch()
    const editorRef = useRef<null | HTMLDivElement>(null)
    
    useEffect(() => {
        ;(async () => {
            if (openFile) {
                if(editorRef.current) {
                    editorRef.current.scrollIntoView({ behavior: 'smooth' })
                }
                setLoading(true)
                try {
                    const fd = await open(openFile, [OpenFlags.O_RDONLY])
                    const data = await read(fd)
                    close(fd)
                    const textData = convertBinaryStringToText(data)
                    setFileData(textData)
                /* c8 ignore start */
                } catch(error) {
                    const e = error as Error
                    dispatch(setError({
                        name: e.name,
                        message: e.message,
                    }))
                }
                /* c8 ignore stop */
                setLoading(false)
            }
        })()
    }, [openFile])

    const handleSave = async () => {
        // do other logic here
        setSaving(true)
        try {
            const fd = await open(openFile, [OpenFlags.O_WRONLY])
            const data = convertTextToBinaryString(fileData)
            await write(fd, data)
            close(fd)
            setSaved(true)
        /* c8 ignore start */
        } catch (error) {
            const e = error as Error
            dispatch(setError({
                name: e.name,
                message: e.message,
            }))
            setSaved(false)
        }
        /* c8 ignore stop */
        setSaving(false)
    }

    const handleClose = () => {
        dispatch(setOpenFile(""))
    }

    return (
        <Paper
            ref={editorRef}
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
                sx={{ textAlign: "center", paddingBottom: "5px", paddingTop: "10px", }}
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
            {openFile && !loading && (
                <textarea
                    disabled={saving}
                    value={fileData}
                    onChange={(event) => {
                        setSaved(false)
                        const { value } = event.target
                        let newValue = ""
                        for (const char of value) {
                            if (char === "\n" || char === "\u25D9") {
                                newValue += "\n"
                            } else {
                                const encoding = getCharacterEncoding(char)
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
                        height: "560px",
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
                        overflowY: "auto",
                        scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                        scrollbarWidth: "thin",
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
                    gap: theme.spacing(1)
                }}
            >
                <Button
                    onClick={handleClose}
                    variant="contained"
                    sx={{
                        display: openFile && !loading ? "block" : "none",
                    }}
                >
                    Close
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={saved || saving}
                    sx={{
                        display: openFile && !loading ? "block" : "none",
                    }}
                >
                    { saved ? "Saved!" : saving ? "Saving..." : "Save"}
                </Button>
            </Box>
        </Paper>
    )
}

export default Editor

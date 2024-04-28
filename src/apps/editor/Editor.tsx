import { Box, Button, Paper, Typography, useTheme } from "@mui/material"
import { useEffect, useState } from "react"
import { getCharacter, getCharacterEncoding } from "../vsfs/components/Viewers"
import Tooltip from "../common/components/Tooltip"
import open from "../../apis/vsfs/posix/open.vsfs"
import OpenFlags from "../../apis/enums/vsfs/OpenFlags.enum"
import read from "../../apis/vsfs/posix/read.vsfs"
import write from "../../apis/vsfs/posix/write.vsfs"
import convertBinaryStringToText from "../common/helpers/convertBinaryStringToText"
import convertTextToBinaryString from "../common/helpers/convertTextToBinaryString"
import { useAppDispatch } from "../../redux/hooks/hooks"
import { setError } from "../../redux/reducers/appSlice"

const Editor = () => {
    const theme = useTheme()
    const [saved, setSaved] = useState(true)
    const [openFile, setOpenFile] = useState("")
    const [fileData, setFileData] = useState("")
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const dispatch = useAppDispatch()

    useEffect(() => {
        ;(async () => {
            if (openFile) {
                setLoading(true)
                const fd = await open(openFile, [OpenFlags.O_RDWR])
                // let's test by writing to the file!
                const testText =
                    "This is some test data I want to try writing to the file."
                const binaryTestText = testText
                    .split("")
                    .map((char) =>
                        getCharacterEncoding(char).toString(2).padStart(8, "0"),
                    )
                    .join("")
                await write(fd, binaryTestText)
                const data = await read(fd)
                const textData = convertBinaryStringToText(data)
                setFileData(textData)
                setLoading(false)
            }
        })()
    }, [openFile])

    useEffect(() => {
        setSaved(false)
    }, [fileData])

    const handleSave = async () => {
        // do other logic here
        setSaving(true)
        try {
            const fd = await open(openFile, [OpenFlags.O_WRONLY])
            const data = convertTextToBinaryString(fileData)
            await write(fd, data)
            setSaved(true)
        } catch(error) {
            dispatch(setError(error as Error))
            setSaved(false)
        }
        setSaving(false)
    }

    const handleOpen = () => {
        setOpenFile("/mydir/123")
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
                <textarea
                    disabled={saving}
                    value={fileData}
                    onChange={(event) => {
                        const { value } = event.target
                        let newValue = ""
                        for (let char of value) {
                            if (char === "\n" || char === "\u25D9") {
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
                        overflowY: "scroll",
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
                    disabled={saved || saving}
                    sx={{
                        display: openFile && !loading ? "block" : "none",
                    }}
                >
                    {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="contained" disabled={saving} onClick={handleOpen}>
                    Open
                </Button>
            </Box>
        </Paper>
    )
}

export default Editor

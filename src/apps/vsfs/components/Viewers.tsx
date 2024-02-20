import { Box, useTheme } from "@mui/material"
import splitIntoBytes from "../../common/helpers/splitIntoBytes"

const getCharacter = (byte: number): string => {
    if(byte <= 32) {
        const offsetForControlCharacters = 58368
        return String.fromCharCode(byte + offsetForControlCharacters) 
    }
    return String.fromCharCode(byte)
}
const convertBinaryByteStringToType = (byte: string, mode: "bin" | "hex" | "ascii") => {
    if(mode === "ascii") {
        return getCharacter(parseInt(byte, 2))
        // return String.fromCharCode()
        // return "\ue401"
        // if(parsedInt < 32 || parsedInt > 126) {
        //     // These are the "printable" characters
        //     return "�"
        // }
        // return charMap[1]
    } else if(mode === "hex") {
        return parseInt(byte, 2).toString(16).padStart(2, "0").toUpperCase()
    } else {
        return byte
    }
}

const Viewer = (props: { data: string, mode: "bin" | "hex" | "ascii" }) => {
    const { data, mode } = props
    const theme = useTheme()
    const bytes = splitIntoBytes(data)
    return (
        <Box sx={{ height: "100%", display: "flex", border: `3px solid ${theme.palette.primary.main}`, padding: "30px", borderRadius: "5px" }}>
            {
                bytes.map((byte, index) => {
                    return <Box className="vga8" key={`byte-${index}`} sx={{ 
                        py: '5px', 
                        px: '10px',
                        "&:hover": {
                            background: theme.palette.primary.main,
                            borderRadius: "3px",
                            cursor: "pointer",
                        }
                    }}>{
                         convertBinaryByteStringToType(byte, mode)
                    }</Box>
                })
            }
        </Box>
    )
}


export default Viewer
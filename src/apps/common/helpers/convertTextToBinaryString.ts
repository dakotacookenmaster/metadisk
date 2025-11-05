import { getCharacterEncoding } from "../../vsfs/components/Viewers";

export default function convertTextToBinaryString(text: string): Uint8Array {
    const buffer = new Uint8Array(text.length)
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        
        if (char === "\n") {
            buffer[i] = getCharacterEncoding("\u25D9")
        } else {
            buffer[i] = getCharacterEncoding(char)
        }
    }
    
    return buffer
}
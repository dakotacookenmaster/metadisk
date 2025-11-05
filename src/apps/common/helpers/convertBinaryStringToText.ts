import { getCharacter } from "../../vsfs/components/Viewers";

export default function convertBinaryStringToText(data: Uint8Array): string {
    let result = ""
    
    for (let i = 0; i < data.length; i++) {
        const byte = data[i]
        const char = getCharacter(byte)
        
        // Convert special characters
        if (char === "\u25D9") {
            result += "\n"
        } else if (char !== "\uE400") {
            // Filter out null characters
            result += char
        }
    }
    
    return result
}
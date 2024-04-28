import { getCharacterEncoding } from "../../vsfs/components/Viewers";

export default function convertTextToBinaryString(text: string) {
    return text.split('').map(char => {
        if(char === "\n") {
            return getCharacterEncoding("\u25D9").toString(2).padStart(8, "0")
        }
        return getCharacterEncoding(char).toString(2).padStart(8, "0") 
    }).join('')
}
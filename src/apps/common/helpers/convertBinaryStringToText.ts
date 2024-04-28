import { chunk } from "lodash";
import { convertBinaryByteStringToType } from "../../vsfs/components/Viewers";

export default function convertBinaryStringToText(data: string) {
    return chunk(data, 8).map(char => convertBinaryByteStringToType(char.join(''), "ascii")).map(char => char === "\u25D9" ? "\n" : char).filter(char => char !== "\uE400").join('')
}
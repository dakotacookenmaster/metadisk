import { chunk } from "lodash"

export default function splitIntoBytes(data: string): string[] {
    const singleBits = data.split('')
    return chunk(singleBits, 8).map(group => group.join(''))
}

import { chunk } from "lodash"

export default function splitIntoBytes(data: string): string[] {
    return chunk(data, 8).map(group => group.join(''))
}

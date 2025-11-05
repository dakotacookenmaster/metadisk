/**
 * Split a Uint8Array into an array of binary string bytes (8 bits each)
 * @param data The Uint8Array to split
 * @returns Array of 8-character binary strings, one per byte
 */
export default function splitIntoBytes(data: Uint8Array): string[] {
    const result: string[] = []
    for (let i = 0; i < data.length; i++) {
        result.push(data[i].toString(2).padStart(8, '0'))
    }
    return result
}

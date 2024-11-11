import { InvalidChunkSizeError } from "../api-errors/InvalidChunkSize.error"

export default function Uint8ArrayChunk(array: Uint8Array, chunkSizeInBytes: number): Uint8Array[] {

    if(array.length % chunkSizeInBytes !== 0) {
        throw new InvalidChunkSizeError(`Array buffer size: ${array.length} bytes; Requested chunk size: ${chunkSizeInBytes} bytes.`)
    }

    const result: Uint8Array[] = []
    for (let i = 0; i < array.length / chunkSizeInBytes; i++) {
        result.push(array.slice(i * chunkSizeInBytes, i * chunkSizeInBytes + chunkSizeInBytes))
    }
    return result
}
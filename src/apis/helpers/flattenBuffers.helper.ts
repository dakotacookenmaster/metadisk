export default function flattenBuffers(buffers: Uint8Array[]): Uint8Array {
    const byteLength = buffers.reduce((accumulator, buffer) => accumulator + buffer.length, 0)
    const newBuffer = new Uint8Array(byteLength)

    let length = 0
    for(let buffer of buffers) {
        newBuffer.set(buffer, length)
        length += buffer.length
    }

    return newBuffer
}
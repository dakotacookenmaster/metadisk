/**
 * Utility class for bit-level operations on ArrayBuffers.
 * Handles non-byte-aligned reads and writes.
 */

/**
 * Writes bits to a Uint8Array at an arbitrary bit position
 * @param buffer The target buffer to write to
 * @param value The value to write (as a number)
 * @param bitOffset The bit position to start writing at (0-indexed)
 * @param bitLength The number of bits to write
 */
export function writeBits(
    buffer: Uint8Array,
    value: number,
    bitOffset: number,
    bitLength: number
): void {
    for (let i = 0; i < bitLength; i++) {
        const bitPos = bitOffset + i
        const byteIndex = Math.floor(bitPos / 8)
        const bitIndex = 7 - (bitPos % 8) // Most significant bit first

        if (byteIndex >= buffer.length) {
            throw new Error(`Buffer overflow: trying to write at byte ${byteIndex}, buffer length is ${buffer.length}`)
        }

        // Extract the bit from value (reading from left to right)
        const bit = (value >> (bitLength - 1 - i)) & 1

        if (bit === 1) {
            buffer[byteIndex] |= (1 << bitIndex)
        } else {
            buffer[byteIndex] &= ~(1 << bitIndex)
        }
    }
}

/**
 * Reads bits from a Uint8Array at an arbitrary bit position
 * @param buffer The source buffer to read from
 * @param bitOffset The bit position to start reading at (0-indexed)
 * @param bitLength The number of bits to read
 * @returns The value as a number
 */
export function readBits(
    buffer: Uint8Array,
    bitOffset: number,
    bitLength: number
): number {
    let value = 0

    for (let i = 0; i < bitLength; i++) {
        const bitPos = bitOffset + i
        const byteIndex = Math.floor(bitPos / 8)
        const bitIndex = 7 - (bitPos % 8) // Most significant bit first

        if (byteIndex >= buffer.length) {
            throw new Error(`Buffer overflow: trying to read at byte ${byteIndex}, buffer length is ${buffer.length}`)
        }

        const bit = (buffer[byteIndex] >> bitIndex) & 1
        value = (value << 1) | bit
    }

    return value
}

/**
 * Converts a binary string (like "101010") to a Uint8Array
 * @param binaryString The binary string to convert
 * @returns A Uint8Array containing the binary data
 */
export function binaryStringToBuffer(binaryString: string): Uint8Array {
    // Validate the string
    for (const char of binaryString) {
        if (char !== "0" && char !== "1") {
            throw new Error(`Invalid character in binary string: ${char}`)
        }
    }

    const byteLength = Math.ceil(binaryString.length / 8)
    const buffer = new Uint8Array(byteLength)

    for (let i = 0; i < binaryString.length; i++) {
        const bit = binaryString[i] === "1" ? 1 : 0
        const byteIndex = Math.floor(i / 8)
        const bitIndex = 7 - (i % 8)

        if (bit === 1) {
            buffer[byteIndex] |= (1 << bitIndex)
        }
    }

    return buffer
}

/**
 * Converts a Uint8Array to a binary string
 * @param buffer The buffer to convert
 * @param bitLength Optional length in bits (defaults to full buffer)
 * @returns A binary string representation
 */
export function bufferToBinaryString(buffer: Uint8Array, bitLength?: number): string {
    const bits = bitLength ?? (buffer.length * 8)
    let result = ""

    for (let i = 0; i < bits; i++) {
        const byteIndex = Math.floor(i / 8)
        const bitIndex = 7 - (i % 8)
        const bit = (buffer[byteIndex] >> bitIndex) & 1
        result += bit.toString()
    }

    return result
}

/**
 * Copies bits from one buffer to another at arbitrary bit positions
 * @param source The source buffer
 * @param sourceBitOffset The bit offset in the source buffer
 * @param dest The destination buffer
 * @param destBitOffset The bit offset in the destination buffer
 * @param bitLength The number of bits to copy
 */
export function copyBits(
    source: Uint8Array,
    sourceBitOffset: number,
    dest: Uint8Array,
    destBitOffset: number,
    bitLength: number
): void {
    for (let i = 0; i < bitLength; i++) {
        const sourceBitPos = sourceBitOffset + i
        const sourceByteIndex = Math.floor(sourceBitPos / 8)
        const sourceBitIndex = 7 - (sourceBitPos % 8)

        const destBitPos = destBitOffset + i
        const destByteIndex = Math.floor(destBitPos / 8)
        const destBitIndex = 7 - (destBitPos % 8)

        const bit = (source[sourceByteIndex] >> sourceBitIndex) & 1

        if (bit === 1) {
            dest[destByteIndex] |= (1 << destBitIndex)
        } else {
            dest[destByteIndex] &= ~(1 << destBitIndex)
        }
    }
}

/**
 * Creates a new buffer with all bits set to 0
 * @param bitLength The length in bits
 * @returns A new Uint8Array buffer
 */
export function createBuffer(bitLength: number): Uint8Array {
    const byteLength = Math.ceil(bitLength / 8)
    return new Uint8Array(byteLength)
}

/**
 * Pads a buffer to a specific bit length with zeros
 * @param buffer The buffer to pad
 * @param targetBitLength The target length in bits
 * @returns A new padded buffer
 */
export function padBuffer(buffer: Uint8Array, targetBitLength: number): Uint8Array {
    const targetByteLength = Math.ceil(targetBitLength / 8)
    
    if (buffer.length >= targetByteLength) {
        return buffer
    }

    const paddedBuffer = new Uint8Array(targetByteLength)
    paddedBuffer.set(buffer)
    
    return paddedBuffer
}

/**
 * Concatenates multiple buffers into a single buffer
 * @param buffers Array of buffers to concatenate
 * @returns A new buffer containing all the data
 */
export function concatBuffers(buffers: Uint8Array[]): Uint8Array {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0)
    const result = new Uint8Array(totalLength)
    
    let offset = 0
    for (const buffer of buffers) {
        result.set(buffer, offset)
        offset += buffer.length
    }
    
    return result
}

/**
 * Validates that a buffer contains valid binary data (all bytes)
 * Note: ArrayBuffers are inherently valid, but this can check for buffer existence
 * @param buffer The buffer to validate
 * @returns true if valid
 */
export function isValidBuffer(buffer: Uint8Array | null | undefined): buffer is Uint8Array {
    return buffer instanceof Uint8Array && buffer.length > 0
}

/**
 * Writes a string as ASCII to a buffer at a bit offset
 * @param buffer The target buffer
 * @param text The ASCII text to write
 * @param bitOffset The bit position to start writing at
 * @param paddedBitLength Optional: pad the string to this bit length
 */
export function writeAsciiString(
    buffer: Uint8Array,
    text: string,
    bitOffset: number,
    paddedBitLength?: number
): void {
    const actualBitLength = text.length * 8

    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i)
        writeBits(buffer, charCode, bitOffset + (i * 8), 8)
    }

    // Pad with zeros if needed
    if (paddedBitLength && actualBitLength < paddedBitLength) {
        for (let i = actualBitLength; i < paddedBitLength; i++) {
            writeBits(buffer, 0, bitOffset + i, 1)
        }
    }
}

/**
 * Reads an ASCII string from a buffer at a bit offset
 * @param buffer The source buffer
 * @param bitOffset The bit position to start reading at
 * @param bitLength The length in bits to read (must be multiple of 8)
 * @returns The ASCII string
 */
export function readAsciiString(
    buffer: Uint8Array,
    bitOffset: number,
    bitLength: number
): string {
    if (bitLength % 8 !== 0) {
        throw new Error("bitLength must be a multiple of 8 for ASCII strings")
    }

    const charCount = bitLength / 8
    let result = ""

    for (let i = 0; i < charCount; i++) {
        const charCode = readBits(buffer, bitOffset + (i * 8), 8)
        if (charCode === 0) {
            // Null terminator or padding
            break
        }
        result += String.fromCharCode(charCode)
    }

    return result
}

/**
 * Slices bits from a buffer and returns a new buffer
 * @param buffer The source buffer
 * @param startBit The starting bit position
 * @param bitLength The number of bits to slice
 * @returns A new buffer containing the sliced bits
 */
export function sliceBits(
    buffer: Uint8Array,
    startBit: number,
    bitLength: number
): Uint8Array {
    const resultBuffer = createBuffer(bitLength)
    copyBits(buffer, startBit, resultBuffer, 0, bitLength)
    return resultBuffer
}

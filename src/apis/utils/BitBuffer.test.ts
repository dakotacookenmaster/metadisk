import { describe, expect, test } from "vitest"
import {
    writeBits,
    readBits,
    binaryStringToBuffer,
    bufferToBinaryString,
    copyBits,
    createBuffer,
    padBuffer,
    concatBuffers,
    isValidBuffer,
    writeAsciiString,
    readAsciiString,
    sliceBits
} from "./BitBuffer.utils"

describe("BitBuffer Utilities", () => {
    describe("writeBits and readBits", () => {
        test("should write and read bits at byte-aligned positions", () => {
            const buffer = new Uint8Array(2)
            writeBits(buffer, 0b11010110, 0, 8)
            expect(readBits(buffer, 0, 8)).toBe(0b11010110)
        })

        test("should write and read bits at non-byte-aligned positions", () => {
            const buffer = new Uint8Array(2)
            writeBits(buffer, 0b1101, 3, 4)
            expect(readBits(buffer, 3, 4)).toBe(0b1101)
        })

        test("should write and read across byte boundaries", () => {
            const buffer = new Uint8Array(2)
            writeBits(buffer, 0b111100001111, 2, 12)
            expect(readBits(buffer, 2, 12)).toBe(0b111100001111)
        })

        test("should write multiple values to buffer", () => {
            const buffer = new Uint8Array(4)
            writeBits(buffer, 0b1010, 0, 4)
            writeBits(buffer, 0b0101, 4, 4)
            writeBits(buffer, 0xFF, 8, 8)
            
            expect(readBits(buffer, 0, 4)).toBe(0b1010)
            expect(readBits(buffer, 4, 4)).toBe(0b0101)
            expect(readBits(buffer, 8, 8)).toBe(0xFF)
        })
    })

    describe("binaryStringToBuffer", () => {
        test("should convert binary string to buffer", () => {
            const binaryStr = "11010110"
            const buffer = binaryStringToBuffer(binaryStr)
            expect(buffer[0]).toBe(0b11010110)
        })

        test("should handle non-byte-aligned strings", () => {
            const binaryStr = "1101"
            const buffer = binaryStringToBuffer(binaryStr)
            expect(buffer[0]).toBe(0b11010000)
        })

        test("should throw error for invalid characters", () => {
            expect(() => binaryStringToBuffer("1012")).toThrow()
        })
    })

    describe("bufferToBinaryString", () => {
        test("should convert buffer to binary string", () => {
            const buffer = new Uint8Array([0b11010110])
            const binaryStr = bufferToBinaryString(buffer)
            expect(binaryStr).toBe("11010110")
        })

        test("should respect bit length parameter", () => {
            const buffer = new Uint8Array([0b11010110])
            const binaryStr = bufferToBinaryString(buffer, 4)
            expect(binaryStr).toBe("1101")
        })
    })

    describe("copyBits", () => {
        test("should copy bits between buffers", () => {
            const source = new Uint8Array([0b11110000])
            const dest = new Uint8Array([0b00000000])
            
            copyBits(source, 0, dest, 0, 4)
            expect(dest[0]).toBe(0b11110000)
        })

        test("should copy bits at non-aligned positions", () => {
            const source = new Uint8Array([0b11110000])
            const dest = new Uint8Array([0b00000000])
            
            copyBits(source, 2, dest, 3, 4)
            expect(readBits(dest, 3, 4)).toBe(readBits(source, 2, 4))
        })
    })

    describe("createBuffer", () => {
        test("should create buffer with correct byte length", () => {
            const buffer = createBuffer(16)
            expect(buffer.length).toBe(2)
        })

        test("should round up for non-byte-aligned lengths", () => {
            const buffer = createBuffer(10)
            expect(buffer.length).toBe(2)
        })

        test("should initialize to zeros", () => {
            const buffer = createBuffer(8)
            expect(buffer[0]).toBe(0)
        })
    })

    describe("padBuffer", () => {
        test("should pad buffer to target length", () => {
            const buffer = new Uint8Array([0xFF])
            const padded = padBuffer(buffer, 16)
            
            expect(padded.length).toBe(2)
            expect(padded[0]).toBe(0xFF)
            expect(padded[1]).toBe(0)
        })

        test("should return same buffer if already at target length", () => {
            const buffer = new Uint8Array([0xFF, 0xAA])
            const padded = padBuffer(buffer, 16)
            
            expect(padded).toBe(buffer)
        })
    })

    describe("concatBuffers", () => {
        test("should concatenate multiple buffers", () => {
            const buf1 = new Uint8Array([0xFF])
            const buf2 = new Uint8Array([0xAA])
            const buf3 = new Uint8Array([0x55])
            
            const result = concatBuffers([buf1, buf2, buf3])
            
            expect(result.length).toBe(3)
            expect(result[0]).toBe(0xFF)
            expect(result[1]).toBe(0xAA)
            expect(result[2]).toBe(0x55)
        })
    })

    describe("isValidBuffer", () => {
        test("should return true for valid buffer", () => {
            const buffer = new Uint8Array([1, 2, 3])
            expect(isValidBuffer(buffer)).toBe(true)
        })

        test("should return false for empty buffer", () => {
            const buffer = new Uint8Array([])
            expect(isValidBuffer(buffer)).toBe(false)
        })

        test("should return false for null or undefined", () => {
            expect(isValidBuffer(null)).toBe(false)
            expect(isValidBuffer(undefined)).toBe(false)
        })
    })

    describe("writeAsciiString and readAsciiString", () => {
        test("should write and read ASCII string", () => {
            const buffer = new Uint8Array(10)
            writeAsciiString(buffer, "Hello", 0)
            
            const result = readAsciiString(buffer, 0, 40)
            expect(result).toBe("Hello")
        })

        test("should handle padding", () => {
            const buffer = new Uint8Array(10)
            writeAsciiString(buffer, "Hi", 0, 80)
            
            const result = readAsciiString(buffer, 0, 80)
            expect(result).toBe("Hi")
        })

        test("should work at non-byte-aligned offsets", () => {
            const buffer = new Uint8Array(10)
            writeBits(buffer, 0b1111, 0, 4) // Write some bits first
            writeAsciiString(buffer, "A", 8)
            
            const result = readAsciiString(buffer, 8, 8)
            expect(result).toBe("A")
        })
    })

    describe("sliceBits", () => {
        test("should slice bits from buffer", () => {
            const buffer = new Uint8Array([0b11110000, 0b10101010])
            const sliced = sliceBits(buffer, 4, 8)
            
            expect(readBits(sliced, 0, 8)).toBe(0b00001010)
        })

        test("should create independent buffer", () => {
            const buffer = new Uint8Array([0xFF])
            const sliced = sliceBits(buffer, 0, 4)
            
            writeBits(sliced, 0, 0, 4)
            expect(buffer[0]).toBe(0xFF) // Original unchanged
        })
    })
})

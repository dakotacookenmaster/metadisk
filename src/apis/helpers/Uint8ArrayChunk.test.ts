import { expect, describe, test } from "vitest"
import Uint8ArrayChunk from "./Uint8ArrayChunk.helper"
import { InvalidChunkSizeError } from "../api-errors/InvalidChunkSize.error"

describe("Uint8ArrayChunk()", () => {
    test("works correctly with a small array and smaller chunks", () => {
        const buffer =  new Uint8Array(8) // 8 bytes
        const chunks = Uint8ArrayChunk(buffer, 4)

        expect(chunks).toEqual([
            new Uint8Array(4),
            new Uint8Array(4)
        ])
    })
    test("works correctly with a larger array and reasonable chunks", () => {
        const buffer = new Uint8Array(100).fill(0xFC)
        const chunks = Uint8ArrayChunk(buffer, 25)

        expect(chunks).toEqual([
            new Uint8Array(25).fill(0xFC),
            new Uint8Array(25).fill(0xFC),
            new Uint8Array(25).fill(0xFC),
            new Uint8Array(25).fill(0xFC)
        ])
    })
    test("fails if the array is not evenly divisible by the chunk size", () => {
        const buffer = new Uint8Array(41)
        expect(() => Uint8ArrayChunk(buffer, 10)).toThrow(InvalidChunkSizeError)
    })
})
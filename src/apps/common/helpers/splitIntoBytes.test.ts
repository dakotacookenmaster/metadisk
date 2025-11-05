import { describe, test, expect } from "vitest"
import splitIntoBytes from "./splitIntoBytes"

describe("it should break a Uint8Array into an array of 8-bit binary strings", () => {
    test("a single byte", () => {
        const data = new Uint8Array([0b00000000])
        expect(splitIntoBytes(data)).toStrictEqual(["00000000"])
    })

    test("two bytes", () => {
        const data = new Uint8Array([0b00000000, 0b10101110])
        expect(splitIntoBytes(data)).toStrictEqual(["00000000", "10101110"])
    })

    test("five bytes", () => {
        const data = new Uint8Array([
            0b00000000,
            0b10101111,
            0b00001111,
            0b11111111,
            0b00000000
        ])
        expect(splitIntoBytes(data)).toStrictEqual([
            "00000000",
            "10101111",
            "00001111",
            "11111111",
            "00000000"
        ])
    })

    test("various byte values", () => {
        const data = new Uint8Array([255, 0, 128, 1])
        expect(splitIntoBytes(data)).toStrictEqual([
            "11111111",
            "00000000",
            "10000000",
            "00000001"
        ])
    })
})
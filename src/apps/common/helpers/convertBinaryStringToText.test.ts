import { describe, test, expect, vi, afterEach } from "vitest"
import convertBinaryStringToText from "./convertBinaryStringToText"
import * as Viewers from "../../vsfs/components/Viewers"

const getCharacter = vi.spyOn(Viewers, "getCharacter")

afterEach(() => {
    vi.clearAllMocks()
})

describe("it should convert Uint8Array to ASCII text", () => {
    test("single letter ('A')", () => {
        const buffer = new Uint8Array([0b01000001]) // 'A'
        expect(convertBinaryStringToText(buffer)).toBe("A")
        expect(getCharacter).toBeCalledTimes(1)
        expect(getCharacter).toBeCalledWith(65)
    })

    test("single null character (\uE400)", () => {
        const buffer = new Uint8Array([0b00000000]) // null
        expect(convertBinaryStringToText(buffer)).toBe("")
        expect(getCharacter).toBeCalledTimes(1)
        expect(getCharacter).toBeCalledWith(0)
    })

    test("single newline character (\u25D9)", () => {
        const buffer = new Uint8Array([0b00001010]) // newline (10)
        expect(convertBinaryStringToText(buffer)).toBe("\n")
        expect(getCharacter).toBeCalledTimes(1)
        expect(getCharacter).toBeCalledWith(10)
    })

    test("a small sentence testing common lowercase letters", () => {
        // The big brown fox jumps over the lazy dog.
        const buffer = new Uint8Array([
            84, 104, 101, 32, 98, 105, 103, 32, 98, 114, 111, 119, 110, 32,
            102, 111, 120, 32, 106, 117, 109, 112, 115, 32, 111, 118, 101, 114,
            32, 116, 104, 101, 32, 108, 97, 122, 121, 32, 100, 111, 103, 46
        ])
        expect(convertBinaryStringToText(buffer)).toBe("The big brown fox jumps over the lazy dog.")
        expect(getCharacter).toBeCalledTimes(42)
    })
})
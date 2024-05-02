import { describe, test, expect, vi, afterEach } from "vitest"
import _ from "lodash"
import convertBinaryStringToText from "./convertBinaryStringToText"
import * as Viewers from "../../vsfs/components/Viewers"

const chunk = vi.spyOn(_, "chunk")
const convertBinaryByteStringToType = vi.spyOn(Viewers, "convertBinaryByteStringToType")

afterEach(() => {
    vi.clearAllMocks()
})

describe("it should convert binary strings to ASCII text", () => {
    test("single letter ('A')", () => {
        expect(convertBinaryStringToText("01000001")).toBe("A")
        expect(chunk).toBeCalledTimes(1)
        expect(chunk).toBeCalledWith("01000001", 8)
        expect(convertBinaryByteStringToType).toBeCalledTimes(1)
        expect(convertBinaryByteStringToType).toBeCalledWith("01000001", "ascii")
    })

    test("single null character (\uE400)", () => {
        expect(convertBinaryStringToText("00000000")).toBe("")
        expect(chunk).toBeCalledTimes(1)
        expect(chunk).toBeCalledWith("00000000", 8)
        expect(convertBinaryByteStringToType).toBeCalledTimes(1)
        expect(convertBinaryByteStringToType).toBeCalledWith("00000000", "ascii")
    })

    test("single newline character (\u25D9)", () => {
        expect(convertBinaryStringToText("00001010")).toBe("\n")
        expect(chunk).toBeCalledTimes(1)
        expect(chunk).toBeCalledWith("00001010", 8)
        expect(convertBinaryByteStringToType).toBeCalledTimes(1)
        expect(convertBinaryByteStringToType).toBeCalledWith("00001010", "ascii")
    })

    test("a small sentence testing common lowercase letters", () => {
        // The big brown fox jumps over the lazy dog.
        const sentence = "010101000110100001100101001000000110001001101001011001110010000001100010011100100110111101110111011011100010000001100110011011110111100000100000011010100111010101101101011100000111001100100000011011110111011001100101011100100010000001110100011010000110010100100000011011000110000101111010011110010010000001100100011011110110011100101110"
        expect(convertBinaryStringToText(sentence)).toBe("The big brown fox jumps over the lazy dog.")
        expect(chunk).toBeCalledTimes(1)
        expect(chunk).toBeCalledWith(sentence, 8)
        expect(convertBinaryByteStringToType).toBeCalledTimes(42)
    })
})
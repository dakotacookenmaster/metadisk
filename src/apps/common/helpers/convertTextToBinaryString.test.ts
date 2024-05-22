import { describe, test, expect, afterEach, vi } from "vitest"
import * as Viewers from "../../vsfs/components/Viewers"
import convertTextToBinaryString from "./convertTextToBinaryString"

const getCharacterEncoding = vi.spyOn(Viewers, "getCharacterEncoding")

afterEach(() => {
    vi.clearAllMocks()
})

describe("it should convert ASCII text into the IBM Code Page 437 binary equivalents", () => {
    test("a single character ('A')", () => {
        expect(convertTextToBinaryString("A")).toBe("01000001")
        expect(getCharacterEncoding).toBeCalledTimes(1)
        expect(getCharacterEncoding).toBeCalledWith("A")
    })
    test("the null character (\uE400)", () => {
        expect(convertTextToBinaryString("\uE400")).toBe("00000000")
        expect(getCharacterEncoding).toBeCalledTimes(1)
        expect(getCharacterEncoding).toBeCalledWith("\uE400")
    })
    test("a newline character (\\n)", () => {
        expect(convertTextToBinaryString("\n")).toBe("00001010")
        expect(getCharacterEncoding).toBeCalledTimes(1)
        expect(getCharacterEncoding).toBeCalledWith("\u25D9")
    })
    test("a long sentence", () => {
        const sentence = "The big brown fox jumps over the lazy dog."
        const result = "010101000110100001100101001000000110001001101001011001110010000001100010011100100110111101110111011011100010000001100110011011110111100000100000011010100111010101101101011100000111001100100000011011110111011001100101011100100010000001110100011010000110010100100000011011000110000101111010011110010010000001100100011011110110011100101110"
        expect(convertTextToBinaryString(sentence)).toBe(result)
        expect(getCharacterEncoding).toBeCalledTimes(42)
    })

    test("an empty string", () => {
        expect(convertTextToBinaryString("")).toBe("")
        expect(getCharacterEncoding).toBeCalledTimes(0)
    })
})
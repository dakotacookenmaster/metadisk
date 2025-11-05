import { describe, test, expect, afterEach, vi } from "vitest"
import * as Viewers from "../../vsfs/components/Viewers"
import convertTextToBinaryString from "./convertTextToBinaryString"

const getCharacterEncoding = vi.spyOn(Viewers, "getCharacterEncoding")

afterEach(() => {
    vi.clearAllMocks()
})

describe("it should convert ASCII text into the IBM Code Page 437 Uint8Array equivalents", () => {
    test("a single character ('A')", () => {
        const result = convertTextToBinaryString("A")
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBe(1)
        expect(result[0]).toBe(0b01000001) // 65 in decimal
        expect(getCharacterEncoding).toBeCalledTimes(1)
        expect(getCharacterEncoding).toBeCalledWith("A")
    })
    test("the null character (\uE400)", () => {
        const result = convertTextToBinaryString("\uE400")
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBe(1)
        expect(result[0]).toBe(0b00000000) // 0 in decimal
        expect(getCharacterEncoding).toBeCalledTimes(1)
        expect(getCharacterEncoding).toBeCalledWith("\uE400")
    })
    test("a newline character (\\n)", () => {
        const result = convertTextToBinaryString("\n")
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBe(1)
        expect(result[0]).toBe(0b00001010) // 10 in decimal
        expect(getCharacterEncoding).toBeCalledTimes(1)
        expect(getCharacterEncoding).toBeCalledWith("\u25D9")
    })
    test("a long sentence", () => {
        const sentence = "The big brown fox jumps over the lazy dog."
        const result = convertTextToBinaryString(sentence)
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBe(42) // 42 characters including period
        // Verify first few characters: 'T', 'h', 'e', ' '
        expect(result[0]).toBe(84) // 'T'
        expect(result[1]).toBe(104) // 'h'
        expect(result[2]).toBe(101) // 'e'
        expect(result[3]).toBe(32) // ' '
        expect(getCharacterEncoding).toBeCalledTimes(42)
    })

    test("an empty string", () => {
        const result = convertTextToBinaryString("")
        expect(result).toBeInstanceOf(Uint8Array)
        expect(result.length).toBe(0)
        expect(getCharacterEncoding).toBeCalledTimes(0)
    })
})
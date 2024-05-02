import { expect, test, describe } from "vitest"
import dec2bin from "./dec2bin"

describe("it should convert decimal numbers to binary", () => {
    test("small number and default size", () => {
        expect(dec2bin(10)).toBe("00001010")
    })
    test("small number and a size of 4", () => {
        expect(dec2bin(10, 4)).toBe("1010")
    })
    test("large number and default size", () => {
        expect(dec2bin(128)).toBe("10000000")
    })
    test("large number and size of 16 size", () => {
        expect(dec2bin(1024, 16)).toBe("0000010000000000")
    })
})
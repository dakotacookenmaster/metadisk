import { describe, test, expect, vi, afterEach } from "vitest"
import _ from "lodash"
import splitIntoBytes from "./splitIntoBytes"

const chunk = vi.spyOn(_, "chunk")

afterEach(() => {
    vi.clearAllMocks()
})

describe("it should break a single bitstring into an array of 8-bit bitstrings", () => {
    test("a single byte", () => {
        expect(splitIntoBytes("00000000")).toStrictEqual(["00000000"])
        expect(chunk).toBeCalledTimes(1)
        expect(chunk).toBeCalledWith("00000000", 8)
    })

    test("two bytes", () => {
        expect(splitIntoBytes("0000000010101110")).toStrictEqual(["00000000", "10101110"])
        expect(chunk).toBeCalledTimes(1)
        expect(chunk).toBeCalledWith("0000000010101110", 8)
    })

    test("five bytes", () => {
        const bytes = "0000000010101111000011111111111100000000"
        expect(splitIntoBytes(bytes)).toStrictEqual([
            "00000000",
            "10101111",
            "00001111",
            "11111111",
            "00000000"
        ])
        expect(chunk).toBeCalledTimes(1)
        expect(chunk).toBeCalledWith(bytes, 8)
    })
})
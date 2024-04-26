import { test, expect } from "vitest"
import BuildDirectoryData from "../../interfaces/vsfs/BuildDirectoryData.interface"
import buildDirectory from "./BuildDirectory.vsfs"
import { FilenameTooLongError } from "../../api-errors/FilenameTooLong.error"

const emptyEntry = {
    entries: [],
} satisfies BuildDirectoryData

const simpleEntry = {
    entries: [
        {
            inode: 0,
            name: ".",
        },
        {
            inode: 0,
            name: "..",
        },
    ],
} satisfies BuildDirectoryData

const complexEntry = {
    entries: [
        {
            inode: 1,
            name: "first",
        },
        {
            inode: 2,
            name: "second",
        },
        {
            inode: 3,
            name: "third",
        },
        {
            inode: 10,
            name: "fourth",
        },
    ],
} satisfies BuildDirectoryData

const brokenEntry = {
    entries: [
        {
            inode: 10,
            name: "first",
        },
        {
            inode: 9,
            name: "second",
        },
        {
            inode: 8,
            name: "third",
        },
        {
            inode: 7,
            name: "brokenbecausethisistoolong",
        },
    ],
} satisfies BuildDirectoryData

test("it should return an empty string when no entries are provided", () => {
    expect(buildDirectory(emptyEntry)).toBe("")
})

test("it should return an appropriate binary string when two entries are provided", () => {
    expect(buildDirectory(simpleEntry)).toBe(
        "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010111000101110000000000000000000000000",
    )
})

test("it should return an appropriate binary string when many entries are provided", () => {
    expect(buildDirectory(complexEntry)).toBe(
        "00000000000000000000000000000000000000000000000000000000000000000110011001101001011100100111001101110100000000000000000000000001000000000000000000000000000000000000000000000000000000000111001101100101011000110110111101101110011001000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000011101000110100001101001011100100110010000000000000000000000001100000000000000000000000000000000000000000000000000000000011001100110111101110101011100100111010001101000000000000000000000001010",
    )
})

test("it should fail to write an entry if the name is too long", () => {
    expect(() => buildDirectory(brokenEntry)).toThrow(FilenameTooLongError)
})

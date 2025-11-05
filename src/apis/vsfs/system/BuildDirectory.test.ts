import { test, expect, vi } from "vitest"
import BuildDirectoryData from "../../interfaces/vsfs/BuildDirectoryData.interface"
import buildDirectory from "./BuildDirectory.vsfs"
import { FilenameTooLongError } from "../../api-errors/FilenameTooLong.error"
import { DirectoryBlockOverflowError } from "../../api-errors/DirectoryBlockOverflow.error"
import { bufferToBinaryString } from "../../utils/BitBuffer.utils"

vi.mock("../../../store", () => {
    const store = {
        getState: () => {
            return {
                fileSystem: {
                    blockSize: 640 // make each block only large enough to contain 5 entries
                }
            }
        }
    }

    return {
        store
    }
})

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

const entryTooLong = {
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

const tooManyEntries = {
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
            name: "fourth",
        },
        {
            inode: 6,
            name: "fifth",
        },
        {
            inode: 5,
            name: "toomany",
        },
    ],
} satisfies BuildDirectoryData

test("it should return an empty Uint8Array when no entries are provided", () => {
    const result = buildDirectory(emptyEntry)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(0)
})

test("it should return an appropriate Uint8Array when two entries are provided", () => {
    const result = buildDirectory(simpleEntry)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32) // 256 bits = 32 bytes (2 entries * 128 bits each)
    const binaryString = bufferToBinaryString(result)
    // Format: name (104 bits = 13 chars * 8 bits) + inode (24 bits)
    // First entry: "." + 12 null bytes + inode 0
    // "." is 0x2E = 00101110, followed by 96 zeros, then 24-bit inode 0
    expect(binaryString).toBe(
        "0010111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000101110001011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    )
})

test("it should return an appropriate Uint8Array when many entries are provided", () => {
    const result = buildDirectory(complexEntry)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(64) // 512 bits = 64 bytes (4 entries * 128 bits each)
    const binaryString = bufferToBinaryString(result)
    // Each entry: name (104 bits) + inode (24 bits) = 128 bits total
    const expected = 
        "0110011001101001011100100111001101110100" + "0".repeat(64) + "000000000000000000000001" + // first
        "011100110110010101100011011011110110111001100100" + "0".repeat(56) + "000000000000000000000010" + // second
        "0111010001101000011010010111001001100100" + "0".repeat(64) + "000000000000000000000011" + // third
        "011001100110111101110101011100100111010001101000" + "0".repeat(56) + "000000000000000000001010" // fourth
    expect(binaryString).toBe(expected)
})

test("it should fail to write an entry if the name is too long", () => {
    expect(() => buildDirectory(entryTooLong)).toThrow(FilenameTooLongError)
})

test("it should fail to write if the entries would overflow a single block", () => {
    expect(() => buildDirectory(tooManyEntries)).toThrow(
        DirectoryBlockOverflowError,
    )
})

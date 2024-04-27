import { expect, test } from "vitest"
import BuildInodeData from "../../interfaces/vsfs/BuildInodeData.interface"
import Permissions from "../../enums/vsfs/Permissions.enum"
import buildInode from "./BuildInode.vsfs"
import { InvalidBlockPointerCountError } from "../../api-errors/InvalidBlockPointerCount.error"
import { InvalidBlockPointerError } from "../../api-errors/InvalidBlockPointer.error"

const createdAt = new Date("01/20/2025")
const lastModified = new Date("02/24/2030")

const goodFile = {
    type: "file",
    size: 300,
    createdAt,
    lastModified,
    permissions: Permissions.READ,
    blockPointers: [0, 0, 0, 0, 0, 0, 0, 0]
} satisfies BuildInodeData

const goodDir = {
    type: "directory",
    size: 128,
    createdAt,
    lastModified,
    permissions: Permissions.READ,
    blockPointers: [1, 0, 0, 8, 0, 9, 0, 12]
} satisfies BuildInodeData

const tooFewBlockPointers = {
    type: "directory",
    size: 128,
    createdAt,
    lastModified,
    permissions: Permissions.READ,
    blockPointers: [1]
} satisfies BuildInodeData

const tooManyBlockPointers = {
    type: "directory",
    size: 128,
    createdAt,
    lastModified,
    permissions: Permissions.READ,
    blockPointers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
} satisfies BuildInodeData

const negativeBlockPointer = {
    type: "file",
    size: 128,
    createdAt,
    lastModified,
    permissions: Permissions.READ,
    blockPointers: [1, 2, 3, 4, 5, -6, 7, 8]
} satisfies BuildInodeData

const blockPointerTooLarge = {
    type: "directory",
    size: 128,
    createdAt,
    lastModified,
    permissions: Permissions.READ,
    blockPointers: [1, 2, 3, 4, 5, 16, 7, 8]
} satisfies BuildInodeData

test("should correctly build the bitstring of a file inode with correct data", () => {
    expect(buildInode(goodFile)).toBe("00010000000000000000000100101100011001111000110111011000010100000111000100100011010011111101000000000000000000000000000000000000")
})

test("should correctly build the bitstring of a directory inode with correct data", () => {
    expect(buildInode(goodDir)).toBe("01010000000000000000000010000000011001111000110111011000010100000111000100100011010011111101000000010000000010000000100100001100")
})

test("should fail when too few block pointers are provided", () => {
    expect(() => buildInode(tooFewBlockPointers)).toThrowError(InvalidBlockPointerCountError)
})

test("should fail when too many pointers are provided", () => {
    expect(() => buildInode(tooManyBlockPointers)).toThrowError(InvalidBlockPointerCountError)
})

test("should fail when a negative block pointer is provided", () => {
    expect(() => buildInode(negativeBlockPointer)).toThrowError(InvalidBlockPointerError)
})

test("should fail when a block pointer is too large", () => {
    expect(() => buildInode(blockPointerTooLarge)).toThrowError(InvalidBlockPointerError)
})


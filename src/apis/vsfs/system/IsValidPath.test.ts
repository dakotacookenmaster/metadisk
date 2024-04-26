import { expect, test } from "vitest"
import isValidPath from "./IsValidPath.vsfs"
import { FilenameTooLongError } from "../../api-errors/FilenameTooLong.error"
import { InvalidPathError } from "../../api-errors/InvalidPath.error"

test("a path containing just a / should return the root inode", () => {
    expect(isValidPath("/")).resolves.toBe(0)
})

test("an path that doesn't begin with a / should throw an error", () => {
    expect(isValidPath("abc")).rejects.toThrow(InvalidPathError)
})

test("an empty path should throw an error", () => {
    expect(isValidPath("")).rejects.toThrow(InvalidPathError)
})

test("a path with a between-slash value longer than 13 characters should throw an error", () => {
    expect(isValidPath('/abcdefghijklmnopqrstuvwxyz')).rejects.toThrow(FilenameTooLongError)
})



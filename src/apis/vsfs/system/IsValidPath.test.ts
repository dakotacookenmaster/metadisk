import { beforeAll, expect, test } from "vitest"
import isValidPath from "./IsValidPath.vsfs"
import { FilenameTooLongError } from "../../api-errors/FilenameTooLong.error"
import { InvalidPathError } from "../../api-errors/InvalidPath.error"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import open from "../posix/open.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

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

test("a path with a filename in between should throw an error", { timeout: 15000 }, async () => {
    await initializeSuperblock(() => {})
    await open("/abc.txt", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE)
    expect(isValidPath("/abc.txt/fakedir")).rejects.toThrowError(InvalidPathError)
})



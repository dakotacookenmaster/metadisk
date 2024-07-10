import { describe, test, expect, beforeAll, beforeEach } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import mkdir from "./mkdir.vsfs"
import rmdir from "./rmdir.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import open from "./open.vsfs"
import Permissions from "../../enums/vsfs/Permissions.enum"
import { InvalidDirectoryPath } from "../../api-errors/InvalidDirectoryPath.error"
import { DirectoryNotEmptyError } from "../../api-errors/DirectoryNotEmpty.error"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("removes a directory", () => {
    test("successfully removes an existing directory", async () => {
        await mkdir("/abc")
        await expect(rmdir("/abc")).resolves.toBeUndefined()
    })
    test("fails to remove a file", async () => {
        await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ_WRITE)
        await expect(rmdir("/abc")).rejects.toThrowError(InvalidDirectoryPath)
    })
    test("fails to remove a non-empty directory", async () => {
        await mkdir("/abc")
        await open("/abc/def", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ_WRITE)
        await expect(rmdir("/abc")).rejects.toThrowError(DirectoryNotEmptyError)
    })
})
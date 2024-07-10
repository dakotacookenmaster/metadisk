import { describe, test, expect, beforeAll, beforeEach } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"
import open from "./open.vsfs"
import unlink from "./unlink.vsfs"
import mkdir from "./mkdir.vsfs"
import { UnlinkDirectoryError } from "../../api-errors/UnlinkDirectory.error"
import write from "./write.vsfs"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("unlinks a file", () => {
    test("successfully unlinks an existing file", async () => {
        await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ_WRITE_EXECUTE)
        await expect(unlink("/abc")).resolves.toBeUndefined()
    })
    test("fails to unlink a directory", async () => {
        await mkdir("/abc")
        await expect(unlink("/abc")).rejects.toThrowError(UnlinkDirectoryError)
    })
    test("successfully unlinks a file with many block pointers allocated", async () => {
        const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ_WRITE_EXECUTE)
        await write(fd, "1".repeat(120000))
        await expect(unlink("/abc")).resolves.toBeUndefined()
    })
})
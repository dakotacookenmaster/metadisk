import { describe, test, expect, beforeAll, beforeEach } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import open from "./open.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"
import write from "./write.vsfs"
import read from "./read.vsfs"
import { InvalidFileDescriptorError } from "../../api-errors/InvalidFileDescriptor.error"
import { AccessDeniedError } from "../../api-errors/AccessDenied.error"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("reads the data from a file, given a file descriptor", () => {
    test("successfully reads data from an existing file", async () => {
        const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE)
        const testData = "1111000011110000"
        await write(fd, testData)
        const savedData = await read(fd)
        expect(savedData).toContain(testData)
    })
    test("fails when a file descriptor is out of range", async () => {
        await expect(read(-1)).rejects.toThrowError(InvalidFileDescriptorError)
        await expect(read(1000000)).rejects.toThrowError(InvalidFileDescriptorError)
    })
    test("fails when a file descriptor is not readable (the mode it was opened with doesn't include reading)", async () => {
        await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_WRONLY], Permissions.WRITE)

        // must open the file again just for writing, because the first open ignores the requested permissions in favor of O_RDWR
        const fd2 = await open("/abc", [OpenFlags.O_WRONLY])
        await expect(read(fd2)).rejects.toThrowError(AccessDeniedError)
    })
})
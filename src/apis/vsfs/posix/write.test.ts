import { describe, test, expect, beforeAll, beforeEach } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import open from "./open.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"
import write from "./write.vsfs"
import { InvalidFileDescriptorError } from "../../api-errors/InvalidFileDescriptor.error"
import { InvalidBinaryStringError } from "../../api-errors/InvalidBinaryString.error"
import { FileOverflowError } from "../../api-errors/FileOverflow.error"
import { AccessDeniedError } from "../../api-errors/AccessDenied.error"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("writes data to a file", () => {
    test("successfully writes data to an open file", async () => {
        const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)
        await expect(write(fd, "1010101")).resolves.toBeUndefined()
    })
    test("fails with an out-of-bounds file descriptor", async () => {
        await expect(write(-1, "1010101")).rejects.toThrowError(InvalidFileDescriptorError)
        await expect(write(1000000, "1010101")).rejects.toThrowError(InvalidFileDescriptorError)
    })
    test("fails to write non-binary data", async () => {
        const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)
        await expect(write(fd, "abcd")).rejects.toThrowError(InvalidBinaryStringError)
    })
    test("fails to write data that exceeds the maximum file size", async () => {
        const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)
        await expect(write(fd, "1".repeat(150000))).rejects.toThrowError(FileOverflowError)
    })
    test("successfully reuses a block when new data of the same size is written", async () => {
        const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)
        await write(fd, "1010101")
        await expect(write(fd, "11110000")).resolves.toBeUndefined()
    })
    test("successfully deallocates blocks when a smaller write is requested", async () => {
        const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)
        await write(fd, "1".repeat(50000))
        await expect(write(fd, "11110000")).resolves.toBeUndefined()
    })
    test("fails to write an update to a file that would allocate more blocks than it can reference", async () => {
        const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)
        await write(fd, "1".repeat(50000))
        await expect(write(fd, "1".repeat(150000))).rejects.toThrowError(FileOverflowError)
    })
    test("fails if the file doesn't have write permissions", async () => {
        // create the file
        await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ_WRITE_EXECUTE)

        // open the file again, but only with read permissions
        const fd = await open("/abc", [OpenFlags.O_RDONLY])
        await expect(write(fd, "101010")).rejects.toThrowError(AccessDeniedError)
    })
})
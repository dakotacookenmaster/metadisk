import { describe, test, expect, beforeEach, beforeAll } from "vitest"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import { store } from "../../../store"
import { setSectors, setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import open from "./open.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"
import { InvalidPathError } from "../../api-errors/InvalidPath.error"
import close from "./close.vsfs"
import { AccessDeniedError } from "../../api-errors/AccessDenied.error"
import { ModeError } from "../../api-errors/Mode.error"
import { OpenFlagError } from "../../api-errors/OpenFlag.error"
import { OpenDirectoryError } from "../../api-errors/OpenDirectory.error"
import { setSectorSize, setSectorsPerBlock } from "../../../redux/reducers/fileSystemSlice"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

describe("opens a file", () => {
    describe("normal disk size", () => {
        beforeEach(async () => {
            await initializeSuperblock(() => {})
        })

        test("successfully creates a new file", async () => {
            const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)
            expect(fd).toBeGreaterThan(2) // ensure a valid file descriptor
        })
        test("fails to create a new file when it's an invalid path", async () => {
            await expect(open("/abc/def", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)).rejects.toThrowError(InvalidPathError)
        })
        test("successfully creates a file with particular permissions", async () => {
            const initialFd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ) // create a file that should be readonly
            close(initialFd)
    
            // open the file again to check its permissions
            await expect(open("/abc", [OpenFlags.O_RDONLY])).resolves.toBeTruthy()
            await expect(open("/abc", [OpenFlags.O_RDWR])).rejects.toThrowError(AccessDeniedError)
            await expect(open("/abc", [OpenFlags.O_WRONLY])).rejects.toThrowError(AccessDeniedError)
        })
        test("fails to create a file if permissions aren't supplied", async () => {
            await expect(open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR])).rejects.toThrowError(ModeError)
        })
        test("fails to create a file if additional flags aren't supplied", async () => {
            await expect(open("/abc", [OpenFlags.O_CREAT], Permissions.READ_WRITE_EXECUTE)).rejects.toThrowError(OpenFlagError)
        })
        test("fails to create a file at the / path", async () => {
            await expect(open("/", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ_WRITE_EXECUTE)).rejects.toThrowError(InvalidPathError)
        })
        test("fails to open a directory path", async () => {
            await expect(open("/", [OpenFlags.O_WRONLY])).rejects.toThrowError(OpenDirectoryError)
        })
    })
    describe("small disk size", async () => {
        beforeEach(async () => {
            store.dispatch(setSectorSize(256))
            store.dispatch(setSectorsPerBlock(1))
            store.dispatch(
                setSectors(
                    [...Array(16)].map(() => ({ data: "0".repeat(256) })),
                ),
            )
            await initializeSuperblock(() => {})
        })

        test("directory successfully grows when many files are added", { timeout: 30000 }, async () => {
            for(let i = 0; i < 5; i++) {
                await expect(open(`/${i}`, [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ)).resolves.toBeGreaterThan(2)
            }
        })
    })
    
    
})


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
import { selectFileDescriptorTable, setSectorSize, setSectorsPerBlock } from "../../../redux/reducers/fileSystemSlice"
import mkdir from "./mkdir.vsfs"
import { InodeOverflowError } from "../../api-errors/InodeOverflow.error"

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
            await expect(open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_WRONLY])).rejects.toThrowError(ModeError)
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
        test("fails to create a file if conflicting flags are supplied", async () => {
            await expect(open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY, OpenFlags.O_WRONLY], Permissions.READ_WRITE_EXECUTE)).rejects.toThrowError(OpenFlagError)
            await expect(open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)).rejects.toThrowError(OpenFlagError)
            await expect(open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR, OpenFlags.O_WRONLY], Permissions.READ_WRITE_EXECUTE)).rejects.toThrowError(OpenFlagError)
            await expect(open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY, OpenFlags.O_WRONLY, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)).rejects.toThrowError(OpenFlagError)
        })
        test("successfully returns a file descriptor when a file already exists, using the O_CREAT flag", async () => {
            const fd = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ_WRITE_EXECUTE)
            const fd2 = await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ_WRITE_EXECUTE)

            const fdTable = selectFileDescriptorTable(store.getState())

            expect(fdTable[fd]).toBeDefined()
            expect(fdTable[fd]).not.toBeNull()
            expect(fdTable[fd2]).toBeDefined()
            expect(fdTable[fd2]).not.toBeNull()

            expect(fdTable[fd]!.inode).toEqual(fdTable[fd2]!.inode)
        })
        test("fails to open an existing directory (that's not the / address)", async () => {
            await mkdir("/abc")
            await expect(open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.EXECUTE)).rejects.toThrowError(OpenDirectoryError)
        })
        test("fails to open a file (with the O_CREAT flag) that already exists and doesn't have read permissions", async () => {
            // open a file for reading that will eventually only have execute permissions
            await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.EXECUTE)

            // this should fail, as the file already exists and cannot be opened for reading
            await expect(open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.EXECUTE)).rejects.toThrowError(AccessDeniedError)
        })
    })
    describe("small disk size", async () => {
        beforeEach(async () => {
            store.dispatch(setSectorSize(256))
            store.dispatch(setSectorsPerBlock(1))
            store.dispatch(
                setSectors(
                    [...Array(16)].map(() => new Uint8Array(32)),
                ),
            )
            await initializeSuperblock(() => {})
        })

        test("directory successfully grows when many files are added", { timeout: 30000 }, async () => {
            for(let i = 0; i < 5; i++) {
                await expect(open(`/${i}`, [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ)).resolves.toBeGreaterThan(2)
            }
        })

        test.only("fails when there aren't enough inodes to create a new file", { timeout: 30000 }, async () => {
            for(let i = 0; i < 9; i++) {
                await expect(open(`/${i}`, [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ)).resolves.toBeGreaterThan(2)
            }
            await expect(open(`/last`, [OpenFlags.O_CREAT, OpenFlags.O_RDONLY], Permissions.READ)).rejects.toThrowError(InodeOverflowError)
        })
    })
    
    
})


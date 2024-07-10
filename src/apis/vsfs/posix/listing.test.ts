import { describe, test, expect, beforeAll, beforeEach } from "vitest"
import open from "./open.vsfs"
import listing from "./listing.vsfs"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import mkdir from "./mkdir.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"
import { InvalidDirectoryPath } from "../../api-errors/InvalidDirectoryPath.error"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("lists the entries in a directory for a given path", () => {
    test(
        "successfully returns an empty entry for an unmodified root (/)",
        { timeout: 30000 },
        async () => {
            const result = await listing("/")
            expect(result).toMatchObject({
                pathname: "/",
                inode: 0,
                entries: [],
            })
        },
    )
    test("successfully returns the appropriate entries for a root with a directory", { timeout: 30000 }, async () => {
        await mkdir("/abc")
        const result = await listing("/")
        expect(result).toMatchObject({
            pathname: "/",
            inode: 0,
            entries: [
                {
                    name: "abc",
                    inode: 1,
                    free: false,
                    pathname: "/abc",
                    type: "directory"
                },
            ]
        })
    })
    test("fails when attempting to list entries for a path that points to a file", async () => {
        await open("/abc", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)
        await expect(listing("/abc")).rejects.toThrowError(InvalidDirectoryPath)
    })
})

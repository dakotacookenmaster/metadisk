import { test, expect, describe, beforeAll, beforeEach } from "vitest"
import { store } from "../../../store"
import getAllDirectories from "./getAllDirectories"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import mkdir from "../../../apis/vsfs/posix/mkdir.vsfs"
import initializeSuperblock from "../../../apis/vsfs/system/InitializeSuperblock.vsfs"
import open from "../../../apis/vsfs/posix/open.vsfs"
import OpenFlags from "../../../apis/enums/vsfs/OpenFlags.enum"
import Permissions from "../../../apis/enums/vsfs/Permissions.enum"
import write from "../../../apis/vsfs/posix/write.vsfs"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true)) // allow it to happen without waiting for the disk
})

beforeEach(async () => {
    await initializeSuperblock(() => {}) // initialize the superblock so reads / writes can happen
})

describe("getAllDirectories() should return block numbers for all directories", () => {
    test("should return only the block for the root directory when there are no additional directories", async () => {
        const result = await getAllDirectories()
        expect(result).toStrictEqual({
            blocks: [4],
        })
    })

    test(
        "should return multiple blocks when directories are contiguously created",
        { timeout: 10000 },
        async () => {
            // setup, create some directories
            await mkdir("/abc")
            await mkdir("/def")
            await mkdir("/def/ghi")

            // run the test
            const result = await getAllDirectories()
            expect(result).toStrictEqual({
                blocks: [4, 5, 6, 7],
            })
        },
    )

    test(
        "should return multiple blocks when directories are not contiguously created",
        { timeout: 10000 },
        async () => {
            // setup, create some directories and files
            await mkdir("/abc")
            const fd = await open("/myfile.txt", [OpenFlags.O_CREAT, OpenFlags.O_RDWR], Permissions.READ_WRITE)
            await write(fd, "101010") // write to the file to make sure it has a block allocated
            await mkdir("/def")

            // run the test
            const result = await getAllDirectories()
            expect(result).toStrictEqual({
                blocks: [4, 5, 7],
            })
        },
    )
})

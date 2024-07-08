import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    test,
    vi,
} from "vitest"
import mkdir from "./mkdir.vsfs"
import { store } from "../../../store"
import { setSectors, setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import { InvalidPathError } from "../../api-errors/InvalidPath.error"
import { NameAlreadyExistsError } from "../../api-errors/NameAlreadyExists.error"
import { writeBlock } from "../system/WriteBlock.vsfs"
import { InodeOverflowError } from "../../api-errors/InodeOverflow.error"
import {
    setSectorSize,
    setSectorsPerBlock,
    setTotalBlocks,
} from "../../../redux/reducers/fileSystemSlice"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

describe("makes a new directory", () => {
    describe("with a large disk", () => {
        beforeEach(async () => {
            await initializeSuperblock(() => {})
        })

        test("throws an error when the path isn't valid for a new directory", async () => {
            await expect(mkdir("/abc/def")).rejects.toThrowError(
                InvalidPathError,
            )
        })
        test("should create a new directory", async () => {
            await expect(mkdir("/abc")).resolves.toBeUndefined()
        })
        test("should fail when part of the path is invalid", async () => {
            await mkdir("/abc")
            await mkdir("/abc/def")
            await expect(mkdir("/abc/ghi/abc")).rejects.toThrowError(
                InvalidPathError,
            )
        })
        test(
            "should create a new directory, even with a nested path",
            { timeout: 15000 },
            async () => {
                await mkdir("/abc")
                await mkdir("/abc/def")
                await expect(mkdir("/abc/def/ghi")).resolves.toBeUndefined()
            },
        )
        test("should fail if the directory already exists", async () => {
            await mkdir("/abc")
            await expect(mkdir("/abc")).rejects.toThrowError(
                NameAlreadyExistsError,
            )
        })
        test("should fail if there are no available inodes", async () => {
            const blockSize = store.getState().fileSystem.blockSize
            await writeBlock(1, "1".repeat(blockSize)) // force all values in the bitmap to be filled
            await expect(mkdir("/abc")).rejects.toThrowError(InodeOverflowError)
        })
        test("should create multiple directories in the same parent (no new block allocation)", async () => {
            await expect(mkdir("/abc")).resolves.toBeUndefined()
            await expect(mkdir("/ghi")).resolves.toBeUndefined()
        })
    })
    describe.only("with a very small disk", () => {
        beforeEach(async () => {
            // initialize a very small disk
            store.dispatch(setSectorSize(128))
            store.dispatch(setSectorsPerBlock(1))

            store.dispatch(
                setSectors(
                    [...Array(16)].map(() => ({ data: "0".repeat(128) })),
                ),
            )

            await initializeSuperblock(() => {}, true)
        })

        afterAll(() => {
            store.dispatch(setSectorSize(4096))
            store.dispatch(setSectorsPerBlock(4))
            store.dispatch(
                setSectors(
                    [...Array(64)].map(() => ({ data: "0".repeat(4096) })),
                ),
            )
        })

        test("should create multiple directories in the same parent (with new block allocation)", async () => {
            for (let i = 0; i < 3; i++) {
                await expect(mkdir(`/${i}`)).resolves.toBeUndefined()
            }
        })
    })
})

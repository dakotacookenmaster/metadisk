import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
} from "vitest"
import mkdir from "./mkdir.vsfs"
import { store } from "../../../store"
import { setSectors, setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import { InvalidPathError } from "../../api-errors/InvalidPath.error"
import { NameAlreadyExistsError } from "../../api-errors/NameAlreadyExists.error"
import { writeBlock } from "../system/BlockCache.vsfs"
import { InodeOverflowError } from "../../api-errors/InodeOverflow.error"
import {
    setSectorSize,
    setSectorsPerBlock,
} from "../../../redux/reducers/fileSystemSlice"
import { binaryStringToBuffer } from "../../utils/BitBuffer.utils"
import { clearCache } from "../system/BlockCache.vsfs"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

describe("makes a new directory", () => {
    describe("with a large disk", () => {
        beforeEach(async () => {
            clearCache()
            await initializeSuperblock()
        })

        test("throws an error when the path isn't valid for a new directory", async () => {
            await expect(mkdir("/abc/def")).rejects.toThrowError(
                InvalidPathError,
            )
        })
        test("should create a new directory", async () => {
            await expect(mkdir("/abc")).resolves.toBeUndefined()
        })
        test("should fail when part of the path is invalid", { timeout: 10000 }, async () => {
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
            const allOnes = binaryStringToBuffer("1".repeat(blockSize))
            await writeBlock(1, allOnes) // force all values in the bitmap to be filled
            await expect(mkdir("/abc")).rejects.toThrowError(InodeOverflowError)
        })
        test("should create multiple directories in the same parent (no new block allocation)", async () => {
            await expect(mkdir("/abc")).resolves.toBeUndefined()
            await expect(mkdir("/ghi")).resolves.toBeUndefined()
        })
    })
    describe("with a very small disk", () => {
        beforeEach(async () => {
            clearCache()
            // initialize a very small disk
            store.dispatch(setSectorSize(256))
            store.dispatch(setSectorsPerBlock(1))

            store.dispatch(
                setSectors(
                    [...Array(16)].map(() => ({ data: new Uint8Array(32) })), // 256 bits = 32 bytes
                ),
            )

            await initializeSuperblock()
        })

        afterAll(() => {
            store.dispatch(setSectorSize(4096))
            store.dispatch(setSectorsPerBlock(4))
            store.dispatch(
                setSectors(
                    [...Array(64)].map(() => ({ data: new Uint8Array(512) })), // 4096 bits = 512 bytes
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

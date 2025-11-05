import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import { writeBlock } from "./WriteBlock.vsfs"
import { BlockOverflowError } from "../../api-errors/BlockOverflow.error"
import { clearCache } from "./BlockCache.vsfs"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    clearCache()
    await initializeSuperblock()
})

describe("read a block from the disk", () => {
    test("should throw an error when a block is outside of the accepted range", async () => {
        const testData = new Uint8Array([1, 0, 1, 0, 1, 0, 1])
        await expect(writeBlock(100, testData)).rejects.toThrowError(InvalidBlockAddressError)
        await expect(writeBlock(-1, testData)).rejects.toThrowError(InvalidBlockAddressError)
    })
    test("should successfully write a valid block", async () => {
        const testData = new Uint8Array([1, 0, 1, 0, 1, 0, 1])
        await expect(writeBlock(4, testData)).resolves.toBeTruthy()
    })
    test("should fail if the write size is larger than a block", async () => {
        const testData = new Uint8Array(20000).fill(1)
        await expect(writeBlock(4, testData)).rejects.toThrowError(BlockOverflowError)
    })
    test("should call the progress callback if it's provided", async () => {
        const progressCb = vi.fn()
        const testData = new Uint8Array([1, 0, 1, 0, 1, 0, 1])
        await expect(writeBlock(4, testData, progressCb)).resolves.toBeTruthy()
        expect(progressCb).toBeCalled()
    })
})
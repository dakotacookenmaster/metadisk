import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import { writeBlocks } from "./WriteBlocks.vsfs"
import { BlockOverflowError } from "../../api-errors/BlockOverflow.error"
import { BadDataLengthError } from "../../api-errors/BadDataLength.error"
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
        await expect(writeBlocks([100], [testData])).rejects.toThrowError(InvalidBlockAddressError)
        await expect(writeBlocks([-1], [testData])).rejects.toThrowError(InvalidBlockAddressError)
    })
    test("should successfully write multiple valid blocks", async () => {
        const testData1 = new Uint8Array([1, 0, 1, 0, 1, 0, 1])
        const testData2 = new Uint8Array([1, 0, 1, 0, 1])
        await expect(writeBlocks([4, 5], [testData1, testData2])).resolves.toBeTruthy()
    })
    test("should fail if the write size is larger than a block", async () => {
        const testData1 = new Uint8Array([1, 0, 1])
        const testData2 = new Uint8Array(20000).fill(1)
        await expect(writeBlocks([4, 5], [testData1, testData2])).rejects.toThrowError(BlockOverflowError)
    })
    test("should fail if the number of blocks provided doesn't match the number of data strings provided", async () => {
        const testData = new Uint8Array([1, 0, 1, 0, 1])
        await expect(writeBlocks([4, 5], [testData])).rejects.toThrowError(BadDataLengthError)
    })
})
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import { writeBlocks } from "./WriteBlocks.vsfs"
import { BlockOverflowError } from "../../api-errors/BlockOverflow.error"
import { BadDataLengthError } from "../../api-errors/BadDataLength.error"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("read a block from the disk", () => {
    test("should throw an error when a block is outside of the accepted range", async () => {
        await expect(writeBlocks([100], ["1010101"])).rejects.toThrowError(InvalidBlockAddressError)
        await expect(writeBlocks([-1], ["1010101"])).rejects.toThrowError(InvalidBlockAddressError)
    })
    test("should successfully write multiple valid blocks", async () => {
        await expect(writeBlocks([4, 5], ["1010101", "10101"])).resolves.toBeTruthy()
    })
    test("should fail if the write size is larger than a block", async () => {
        await expect(writeBlocks([4, 5], ["101", "1".repeat(20000)])).rejects.toThrowError(BlockOverflowError)
    })
    test("should call the progress callback if it's provided", async () => {
        const progressCb = vi.fn()
        await expect(writeBlocks([4, 5], ["1010101", "10101"], progressCb)).resolves.toBeTruthy()
        expect(progressCb).toBeCalled()
    })
    test("should fail if the number of blocks provided doesn't match the number of data strings provided", async () => {
        await expect(writeBlocks([4, 5], ["10101"])).rejects.toThrowError(BadDataLengthError)
    })
})
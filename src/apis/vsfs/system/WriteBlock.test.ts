import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import { writeBlock } from "./WriteBlock.vsfs"
import { BlockOverflowError } from "../../api-errors/BlockOverflow.error"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("read a block from the disk", () => {
    test("should throw an error when a block is outside of the accepted range", async () => {
        await expect(writeBlock(100, "1010101")).rejects.toThrowError(InvalidBlockAddressError)
        await expect(writeBlock(-1, "1010101")).rejects.toThrowError(InvalidBlockAddressError)
    })
    test("should successfully write a valid block", async () => {
        await expect(writeBlock(4, "1010101")).resolves.toBeTruthy()
    })
    test("should fail if the write size is larger than a block", async () => {
        await expect(writeBlock(4, "1".repeat(20000))).rejects.toThrowError(BlockOverflowError)
    })
    test("should call the progress callback if it's provided", async () => {
        const progressCb = vi.fn()
        await expect(writeBlock(4, "1010101", progressCb)).resolves.toBeTruthy()
        expect(progressCb).toBeCalled()
    })
})
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import { readBlocks } from "./ReadBlocks.vsfs"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("reads multiple block from the disk", () => {
    test("should throw an error when a block is outside of the accepted range", async () => {
        await expect(readBlocks([0, 1, 2, -1])).rejects.toThrowError(InvalidBlockAddressError)
        await expect(readBlocks([2, 100])).rejects.toThrowError(InvalidBlockAddressError)
    })
    test("should successfully read multiple valid blocks", async () => {
        await expect(readBlocks([0, 1, 2])).resolves.toBeTruthy()
    })
    test("should call the progress callback if it's provided", async () => {
        const progressCb = vi.fn()
        await expect(readBlocks([0, 1, 2], progressCb)).resolves.toBeTruthy()
        expect(progressCb).toBeCalled()
    })
})
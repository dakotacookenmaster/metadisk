import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import { readBlock } from "./ReadBlock.vsfs"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import { clearCache } from "./BlockCache.vsfs"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    clearCache()
    await initializeSuperblock()
})

describe("read a block from the disk", () => {
    test("should throw an error when the block is outside of the accepted range", async () => {
        await expect(readBlock(-1)).rejects.toThrowError(InvalidBlockAddressError)
        await expect(readBlock(100)).rejects.toThrowError(InvalidBlockAddressError)
    })
    test("should successfully read a valid block", async () => {
        await expect(readBlock(0)).resolves.toBeTruthy()
    })
    test("should call the progress callback if it's provided", async () => {
        const progressCb = vi.fn()
        await expect(readBlock(0, progressCb)).resolves.toBeTruthy()
        expect(progressCb).toBeCalled()
    })
})
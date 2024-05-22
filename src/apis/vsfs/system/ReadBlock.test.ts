import { beforeAll, beforeEach, describe, expect, test } from "vitest"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import { readBlock } from "./ReadBlock.vsfs"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("read a block from the disk", () => {
    test("should throw an error when the block is outside of the accepted range", async () => {
        await expect(readBlock(-1)).rejects.toThrowError(InvalidBlockAddressError)
        await expect(readBlock(100)).rejects.toThrowError(InvalidBlockAddressError)
    })
})
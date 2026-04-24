import { expect, test, describe, vi } from "vitest"
import { readSector } from "./ReadSector.disk"
import * as diskSlice from "../../redux/reducers/diskSlice"
import * as uuid from "uuid"
import { store } from "../../store"
import { InvalidSectorError } from "../api-errors/InvalidSector.error"

const sectors = [...Array(3)].map(() => {
    return {
        data: new Uint8Array(512), // 512 bytes per sector, initialized to 0
    }
})

const mockPayload = {
    requestId: "abcd",
    type: "read",
    sectorNumber: 0,
    data: sectors[0],
}

vi.mock("uuid", () => {
    return {
        v4: () => "abcd",
    }
})

vi.mock("../../store", () => {
    const store = {
        getState: () => {
            return {
                disk: {
                    skipWaitTime: true, // set this to help tests move without delay
                    sectors,
                    currentlyServicing: [mockPayload],
                },
            }
        },
        dispatch: () => {},
    }

    return {
        store,
    }
})

const selectSectors = vi.spyOn(diskSlice, "selectSectors")
const enqueue = vi.spyOn(diskSlice, "enqueue")
const v4 = vi.spyOn(uuid, "v4")
const dispatch = vi.spyOn(store, "dispatch")
const processQueue = vi.spyOn(diskSlice, "processQueue")
const removeFromCurrentlyServicing = vi.spyOn(
    diskSlice,
    "removeFromCurrentlyServicing",
)

test("expect a simple read of an existing sector to work", async () => {
    await expect(readSector(0)).resolves.toStrictEqual(mockPayload)
    expect(selectSectors).toBeCalledTimes(1)
    expect(v4).toBeCalledTimes(1)
    expect(enqueue).toBeCalledTimes(1)
    expect(enqueue).toBeCalledWith({
        type: "read",
        sectorNumber: 0,
        requestId: "abcd",
    })
    expect(processQueue).toBeCalledTimes(1)
    expect(removeFromCurrentlyServicing).toBeCalledTimes(1)
    expect(removeFromCurrentlyServicing).toBeCalledWith("abcd")
    expect(dispatch).toBeCalledTimes(3)
})

describe("expect sector reads out of bounds to throw an error", () => {
    test("positive out of bound reads should throw an error", async () => {
        await expect(readSector(4)).rejects.toThrowError(InvalidSectorError)
    })
    test("negative out of bounds reads should throw an error", async () => {
        await expect(readSector(-1)).rejects.toThrowError(InvalidSectorError)
    })
})

test("passing an appId surfaces it in the enqueued payload (for disk-queue attribution)", async () => {
    enqueue.mockClear()
    await readSector(0, "file-explorer")
    expect(enqueue).toBeCalledWith({
        type: "read",
        sectorNumber: 0,
        requestId: "abcd",
        appId: "file-explorer",
    })
})

test("omitting appId leaves it off the enqueued payload entirely", async () => {
    enqueue.mockClear()
    await readSector(0)
    // Important: appId must not even be present as `undefined` — it would
    // break tests using exact-equality matchers and pollute selector logs.
    expect(enqueue).toBeCalledWith({
        type: "read",
        sectorNumber: 0,
        requestId: "abcd",
    })
})

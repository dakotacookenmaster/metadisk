import { expect, test, describe, vi } from "vitest"
import { readSector } from "./ReadSector.disk"
import * as diskSlice from "../../redux/reducers/diskSlice"
import * as uuid from "uuid"
import { store } from "../../store"
import { InvalidSectorError } from "../api-errors/InvalidSector.error"

const sectors = [...Array(3)].map(() => {
    return {
        data: "0".repeat(4096),
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

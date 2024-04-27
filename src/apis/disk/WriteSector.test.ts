import { describe, expect, test, vi } from "vitest"
import { writeSector } from "./WriteSector.disk"
import * as diskSlice from "../../redux/reducers/diskSlice"
import * as uuid from "uuid"
import { store } from "../../store"
import { InvalidSectorError } from "../api-errors/InvalidSector.error"
import { InvalidBinaryStringError } from "../api-errors/InvalidBinaryString.error"
import { SectorOverflowError } from "../api-errors/SectorOverflow.error"

const sectors = [...Array(3)].map(() => {
    return {
        data: "0".repeat(4096),
    }
})

const mockPayload = {
    requestId: "abcd",
    type: "write",
    sectorNumber: 0,
    data: "1".repeat(4096),
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
                    skipWaitTime: true, // run tests without delay
                    sectors,
                    currentlyServicing: [mockPayload],
                },
                fileSystem: {
                    sectorSize: 4096,
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

test("expect a simple write of an existing sector to work", async () => {
    await expect(writeSector(0, "1".repeat(4096))).resolves.toStrictEqual(
        mockPayload,
    )
    expect(selectSectors).toBeCalledTimes(1)
    expect(v4).toBeCalledTimes(1)
    expect(enqueue).toBeCalledTimes(1)
    expect(enqueue).toBeCalledWith({
        type: "write",
        sectorNumber: 0,
        data: "1".repeat(4096),
        requestId: "abcd",
    })
    expect(processQueue).toBeCalledTimes(1)
    expect(removeFromCurrentlyServicing).toBeCalledTimes(1)
    expect(removeFromCurrentlyServicing).toBeCalledWith("abcd")
    expect(dispatch).toBeCalledTimes(3)
})

describe("non-binary string data should throw an error", () => {
    test("ASCII data should throw an error", async () => {
        await expect(writeSector(0, "abcd")).rejects.toThrowError(
            InvalidBinaryStringError,
        )
    })
    test("partial binary data and ASCII data should throw an error", async () => {
        await expect(writeSector(0, "010101a")).rejects.toThrowError(
            InvalidBinaryStringError,
        )
    })
})

describe("expect out-of-bounds sector writes to throw an error", () => {
    test("positive out of bounds writes should throw an error", async () => {
        await expect(writeSector(4, "0")).rejects.toThrowError(
            InvalidSectorError,
        )
    })
    test("negative out of bounds writes should throw an error", async () => {
        await expect(writeSector(-1, "0")).rejects.toThrowError(
            InvalidSectorError,
        )
    })
})

describe("writing too much data to a sector should throw an error", async () => {
    test("one bit overflow should throw an error", async () => {
        await expect(writeSector(0, "0".repeat(4097))).rejects.toThrowError(
            SectorOverflowError,
        )
    })
    test("a large overflow should throw an error", async () => {
        await expect(writeSector(0, "0".repeat(8000))).rejects.toThrowError(
            SectorOverflowError,
        )
    })
})

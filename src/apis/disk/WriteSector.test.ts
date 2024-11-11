import { describe, expect, test, vi } from "vitest"
import { writeSector } from "./WriteSector.disk"
import * as diskSlice from "../../redux/reducers/diskSlice"
import * as uuid from "uuid"
import { store } from "../../store"
import { InvalidSectorError } from "../api-errors/InvalidSector.error"
import { SectorOverflowError } from "../api-errors/SectorOverflow.error"
import { SectorUnderflowError } from "../api-errors/SectorUnderflow.error"

const sectors = [...Array(3)].map(() => {
    return {
        data: new Uint8Array(512),
    }
})

const mockPayload = {
    requestId: "abcd",
    type: "write",
    sectorNumber: 0,
    data: new Uint8Array(512).fill(0xFF)
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
    await expect(writeSector(0, new Uint8Array(512).fill(0xFF))).resolves.toStrictEqual(
        mockPayload,
    )
    expect(selectSectors).toBeCalledTimes(1)
    expect(v4).toBeCalledTimes(1)
    expect(enqueue).toBeCalledTimes(1)
    expect(enqueue).toBeCalledWith({
        type: "write",
        sectorNumber: 0,
        data: new Uint8Array(512).fill(0xFF),
        requestId: "abcd",
    })
    expect(processQueue).toBeCalledTimes(1)
    expect(removeFromCurrentlyServicing).toBeCalledTimes(1)
    expect(removeFromCurrentlyServicing).toBeCalledWith("abcd")
    expect(dispatch).toBeCalledTimes(3)
})

describe("expect out-of-bounds sector writes to throw an error", () => {
    test("positive out of bounds writes should throw an error", async () => {
        await expect(writeSector(4, new Uint8Array(512))).rejects.toThrowError(
            InvalidSectorError,
        )
    })
    test("negative out of bounds writes should throw an error", async () => {
        await expect(writeSector(-1, new Uint8Array(512))).rejects.toThrowError(
            InvalidSectorError,
        )
    })
})

describe("writing too much data to a sector should throw an error", async () => {
    test("one byte overflow should throw an error", async () => {
        await expect(writeSector(0, new Uint8Array(513))).rejects.toThrowError(
            SectorOverflowError,
        )
    })
    test("a large overflow should throw an error", async () => {
        await expect(writeSector(0, new Uint8Array(1024))).rejects.toThrowError(
            SectorOverflowError,
        )
    })
})

describe("writing too little data to a sector should throw an error", async () => {
    test("one byte underflow should throw an error", async () => {
        await expect(writeSector(0, new Uint8Array(511))).rejects.toThrowError(
            SectorUnderflowError,
        )
    })
    test("a large underflow should throw an error", async () => {
        await expect(writeSector(0, new Uint8Array(1))).rejects.toThrowError(
            SectorUnderflowError,
        )
    })
})

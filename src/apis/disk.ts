import { enqueue, processQueue, selectSectorSize } from "../redux/reducers/diskSlice"
import { store } from "../store"
import { InvalidBinaryStringError } from "./api-errors/InvalidBinaryString.error"
import { SectorOverflowError } from "./api-errors/SectorOverflow.error"
import { v4 as uuid } from "uuid"

export interface WritePayload {
    type: "write"
    sectorNumber: number
    requestId: string,
    data: string
}

export interface ReadPayload {
    type: "read"
    requestId: string
    sectorNumber: number
}

export interface CurrentlyServicingPayload {
    requestId: string
    type: 'read' | 'write'
    data?: string
}

/**
 * Instructs the disk to write a blob of ASCII-encoded binary
 * data to a particular sector.
 * @param sector
 * @throws {InvalidBinaryStringError} String must be composed entirely of 0s and 1s
 * @throws {SectorOverflowError} String must be small enough to fit within the desired sector
 */
export const writeSector = (sector: number, data: string) => {
    // Check validity of the data
    for (let char of data) {
        if (char !== "0" && char !== "1") {
            throw new InvalidBinaryStringError(`Invalid character: ${char}`)
        }
    }

    // Guarantee the data can be written to the sector
    const sectorSize = selectSectorSize(store.getState())
    if (data.length > sectorSize) {
        throw new SectorOverflowError(
            `Sector Size: ${sectorSize} bits, Binary Size: ${data.length} bits`,
        )
    }

    // The operation is valid. Add it to the disk queue.
    const id = uuid()

    store.dispatch(
        enqueue({
            type: "write",
            sectorNumber: sector,
            requestId: id,
            data,
        }),
    )
    store.dispatch(processQueue())

    return id
}

/**
 * Instructs the disk to read a blob of ASCII-encoded binary
 * data from a particular sector.
 * @param sector
 */
export const readSector = (sector: number) => {

    // Add operation to the disk queue.
    const id = uuid()

    store.dispatch(
        enqueue({
            type: "read",
            sectorNumber: sector,
            requestId: id,
        }),
    )
    store.dispatch(processQueue())

    return id
}
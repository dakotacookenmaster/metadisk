import {
    enqueue,
    processQueue,
    removeFromCurrentlyServicing,
    selectSectors,
} from "../redux/reducers/diskSlice"
import { selectSectorSize } from "../redux/reducers/fileSystemSlice"
import { store } from "../store"
import { InvalidBinaryStringError } from "./api-errors/InvalidBinaryString.error"
import { InvalidSectorError } from "./api-errors/InvalidSector.error"
import { v4 as uuid } from "uuid"
import { SectorOverflowError } from "./api-errors/SectorOverflow.error"

export interface WritePayload {
    type: "write"
    sectorNumber: number
    requestId: string
    data: string
}

export interface ReadPayload {
    type: "read"
    requestId: string
    sectorNumber: number
}

export interface CurrentlyServicingPayload {
    requestId: string
    type: "read" | "write"
    sectorNumber: number
    data?: string
}

/**
 * Instructs the disk to write a blob of ASCII-encoded binary
 * data to a particular sector.
 * @param sector The sector you wish to write to
 * @param data The data you wish to write to the requested sector
 * @throws `InvalidBinaryStringError` String must be composed entirely of 0s and 1s
 * @throws `SectorOverflowError` String must be small enough to fit within the desired sector
 * @returns `CurrentlyServicingPayload` The data from the result of the write, indicating its completion.
 */
export const writeSector = async (
    sector: number,
    data: string,
): Promise<CurrentlyServicingPayload> => {
    // Verify that the sector exists
    const sectors = selectSectors(store.getState())

    if (sector < 0 || sector >= sectors.length) {
        throw new InvalidSectorError(
            `Total Sectors: ${sectors.length} (0 - ${
                sectors.length - 1
            }), Requested Sector: ${sector}`,
        )
    }

    // Check validity of the data (all 1s and 0s?)
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

    let cs: CurrentlyServicingPayload | undefined

    // Would this be an acceptable place to spin-wait for the data going into the queue to be processed?
    while (!(cs = store.getState().disk.currentlyServicing?.find(item => item.requestId === id))) {
        await new Promise((resolve) => setTimeout(resolve, 50)) // Wait 50ms and then check again
    }

    store.dispatch(removeFromCurrentlyServicing(cs!.requestId))

    return cs as CurrentlyServicingPayload
}

/**
 * Instructs the disk to read a blob of ASCII-encoded binary
 * data from a particular sector.
 * @param sector
 * @throws {InvalidSectorError} Sector must be a valid sector on the disk
 * @returns `CurrentlyServicingPayload` The data from the result of the write, indicating its completion.
 */

export const readSector = async (
    sector: number,
): Promise<CurrentlyServicingPayload> => {
    // Verify that the sector exists
    const sectors = selectSectors(store.getState())

    if (sector < 0 || sector >= sectors.length) {
        throw new InvalidSectorError(
            `Total Sectors: ${sectors.length} (0 - ${
                sectors.length - 1
            }), Requested Sector: ${sector}`,
        )
    }

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

    let cs: CurrentlyServicingPayload | undefined

    // Would this be an acceptable place to spin-wait for the data going into the queue to be processed?
    while (!(cs = store.getState().disk.currentlyServicing?.find(item => item.requestId === id))) {
        await new Promise((resolve) => setTimeout(resolve, 50)) // Wait 50ms and then check again
    }

    store.dispatch(removeFromCurrentlyServicing(cs!.requestId))


    return cs as CurrentlyServicingPayload
}

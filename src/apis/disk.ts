import {
    enqueue,
    processQueue,
    selectSectors,
} from "../redux/reducers/diskSlice"
import { selectSectorSize, selectSectorsPerBlock, selectSuperblock } from "../redux/reducers/fileSystemSlice"
import { store } from "../store"
import { InvalidBinaryStringError } from "./api-errors/InvalidBinaryString.error"
import {
    InvalidSectorError,
} from "./api-errors/InvalidSector.error"
import { v4 as uuid } from "uuid"
import { WritingToReservedSectorError } from "./api-errors/WritingToReservedSector.error"
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
    data?: string
}

/**
 * Instructs the disk to write a blob of ASCII-encoded binary
 * data to a particular sector.
 * @param sector The sector you wish to write to
 * @param data The data you wish to write to the requested sector
 * @param allowUnsafeWriteToReservedSector Enable an unsafe write to a reserved sector 
 * (use only if you intend to overwrite parts of the superblock, i-bmap, or d-bmap)
 * @throws `InvalidBinaryStringError` String must be composed entirely of 0s and 1s
 * @throws `SectorOverflowError` String must be small enough to fit within the desired sector
 * @throws `WritingToReservedSectorError` Attempted writes into the reserved block region without specifying `allowUnsafeWriteToReservedSector`
 * will cause this error to be thrown.
 * @returns 
 */
export const writeSector = (sector: number, data: string, allowUnsafeWriteToReservedSector: boolean = false) => {
    // Verify that the sector exists
    const sectors = selectSectors(store.getState())
    const sectorsPerBlock = selectSectorsPerBlock(store.getState())
    const { numberOfInodeBlocks } = selectSuperblock(store.getState())
    const reservedSectors = sectorsPerBlock * 3 + numberOfInodeBlocks

    console.log("LENGTH:", sectors)

    if (sector < 0 || sector >= sectors.length) {
        throw new InvalidSectorError(
            `Total Sectors: ${sectors.length} (0 - ${
                sectors.length - 1
            }), Requested Sector: ${sector}`,
        )
    }

    // Prevent accidental writing to reserved sectors (superblock, i-bmap, d-bmap, inodes)
    // if (sector < reservedSectors && !allowUnsafeWriteToReservedSector) {
    //     throw new WritingToReservedSectorError(`Sector: ${sector}`)
    // }

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

    return id
}

/**
 * Instructs the disk to read a blob of ASCII-encoded binary
 * data from a particular sector.
 * @param sector
 * @throws {InvalidSectorError} Sector must be a valid sector on the disk
 */
export const readSector = (sector: number) => {
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

    return id
}

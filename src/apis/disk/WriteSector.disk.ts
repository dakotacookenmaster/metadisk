import { enqueue, processQueue, removeFromCurrentlyServicing, selectSectors } from "../../redux/reducers/diskSlice"
import { selectSectorSize } from "../../redux/reducers/fileSystemSlice"
import { store } from "../../store"
import { InvalidSectorError } from "../api-errors/InvalidSector.error"
import { SectorOverflowError } from "../api-errors/SectorOverflow.error"
import { SectorUnderflowError } from "../api-errors/SectorUnderflow.error"
import CurrentlyServicingPayload from "../interfaces/disk/CurrentlyServicingPayload.interface"
import { v4 as uuid } from "uuid"

/**
 * Instructs the disk to write a blob of ASCII-encoded binary
 * data to a particular sector.
 * @param sector The sector you wish to write to
 * @param data The data you wish to write to the requested sector
 * @throws `SectorUnderflowError` String must be large enough to fill the desired sector
 * @throws `SectorOverflowError` String must be small enough to fit within the desired sector
 * @returns `CurrentlyServicingPayload` The data from the result of the write, indicating its completion.
 */
export const writeSector = async (
    sector: number,
    data: Uint8Array,
): Promise<CurrentlyServicingPayload<"write">> => {
    // Verify that the sector exists
    const state = store.getState()
    const sectors = selectSectors(state)
    const sectorSize = selectSectorSize(store.getState()) // in bits

    if (sector < 0 || sector >= sectors.length) {
        throw new InvalidSectorError(
            `Total Sectors: ${sectors.length} (0 - ${sectors.length - 1
            }), Requested Sector: ${sector}`,
        )
    }

    // Guarantee the data can be written to the sector
    if ((data.length * 8) > sectorSize) {
        throw new SectorOverflowError(
            `Sector Size: ${sectorSize * 8} bits, Binary Size: ${data.length * 8} bits`,
        )
    }

    if ((data.length * 8) < sectorSize) {
        throw new SectorUnderflowError(`Sector Size: ${sectorSize * 8} bits, Binary Size: ${data.length * 8} bits`)
    }

    // The operation is valid. Add it to the disk queue.
    const id = uuid()

    store.dispatch(
        enqueue({
            type: "write",
            sectorNumber: sector,
            requestId: id,
            data: data, // make sure we write a whole sector in bytes
        }),
    )

    store.dispatch(processQueue())

    let cs: CurrentlyServicingPayload<"write"> | undefined

    // spin-wait for the data going into the queue to be processed
    /* c8 ignore start */
    while (!(cs = store.getState().disk.currentlyServicing?.find(item => item.requestId === id))) {
        await new Promise((resolve) => setTimeout(resolve, 50)) // Wait 50ms and then check again
    }
    /* c8 ignore stop */

    store.dispatch(removeFromCurrentlyServicing(cs!.requestId))

    return cs as CurrentlyServicingPayload<"write">
}
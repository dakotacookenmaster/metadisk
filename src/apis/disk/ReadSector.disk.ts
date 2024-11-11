import { enqueue, processQueue, removeFromCurrentlyServicing, selectSectors } from "../../redux/reducers/diskSlice"
import { store } from "../../store"
import { InvalidSectorError } from "../api-errors/InvalidSector.error"
import CurrentlyServicingPayload from "../interfaces/disk/CurrentlyServicingPayload.interface"
import { v4 as uuid } from "uuid"


/**
 * Instructs the disk to read a blob of ASCII-encoded binary
 * data from a particular sector.
 * @param sector
 * @throws {InvalidSectorError} Sector must be a valid sector on the disk
 * @returns `CurrentlyServicingPayload` The data from the result of the write, indicating its completion.
 */
export const readSector = async (
    sector: number,
): Promise<CurrentlyServicingPayload<"read">> => {
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

    let cs: CurrentlyServicingPayload<"read"> | undefined

    // spin-wait for the data going into the queue to be processed
    /* c8 ignore start */
    while (!(cs = store.getState().disk.currentlyServicing?.find(item => item.requestId === id))) {
        await new Promise((resolve) => setTimeout(resolve, 50)) // Wait 50ms and then check again
    }
    /* c8 ignore stop */

    store.dispatch(removeFromCurrentlyServicing(cs!.requestId))


    return cs as CurrentlyServicingPayload<"read">
}
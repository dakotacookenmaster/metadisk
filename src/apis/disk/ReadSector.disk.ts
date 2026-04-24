import { enqueue, processQueue, removeFromCurrentlyServicing, selectSectors } from "../../redux/reducers/diskSlice"
import { store } from "../../store"
import { InvalidSectorError } from "../api-errors/InvalidSector.error"
import CurrentlyServicingPayload from "../interfaces/disk/CurrentlyServicingPayload.interface"
import DiskReadPayload from "../interfaces/disk/DiskReadPayload.interface"
import { v4 as uuid } from "uuid"


/**
 * Instructs the disk to read a blob of ASCII-encoded binary
 * data from a particular sector.
 * @param sector
 * @param appId Optional id of the registered app initiating the request.
 *              Apps should not pass this manually — it is injected for them
 *              by the `usePosix()` hook from React context. The disk
 *              simulator uses it to render an icon under each queued block.
 * @param opId Optional id of the higher-level operation this sector
 *              belongs to (e.g. one `readBlock` call). Generated and passed
 *              by `readBlock`/`writeBlock`; loose `readSector` callers can
 *              omit it. The disk simulator groups queued sectors that share
 *              an `opId` into one bracketed group, so dequeuing items from
 *              the front never causes later operations to bleed forward
 *              into earlier groups.
 * @throws {InvalidSectorError} Sector must be a valid sector on the disk
 * @returns `CurrentlyServicingPayload` The data from the result of the write, indicating its completion.
 */
export const readSector = async (
    sector: number,
    appId?: string,
    opId?: string,
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

    // Only attach `appId` / `opId` when they were provided. Keeping them
    // absent (rather than `undefined`) preserves exact-equality assertions
    // in older tests that don't know about app/op attribution.
    const payload: DiskReadPayload = {
        type: "read",
        sectorNumber: sector,
        requestId: id,
        ...(appId !== undefined ? { appId } : {}),
        ...(opId !== undefined ? { opId } : {}),
    }

    store.dispatch(enqueue(payload))
    
    store.dispatch(processQueue())

    let cs: CurrentlyServicingPayload | undefined

    // spin-wait for the data going into the queue to be processed
    /* c8 ignore start */
    while (!(cs = store.getState().disk.currentlyServicing?.find(item => item.requestId === id))) {
        await new Promise((resolve) => setTimeout(resolve, 50)) // Wait 50ms and then check again
    }
    /* c8 ignore stop */

    store.dispatch(removeFromCurrentlyServicing(cs!.requestId))


    return cs as CurrentlyServicingPayload
}
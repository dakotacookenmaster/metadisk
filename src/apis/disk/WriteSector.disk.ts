import { enqueue, processQueue, removeFromCurrentlyServicing, selectSectors } from "../../redux/reducers/diskSlice"
import { selectSectorSize } from "../../redux/reducers/fileSystemSlice"
import { store } from "../../store"
import { InvalidSectorError } from "../api-errors/InvalidSector.error"
import { SectorOverflowError } from "../api-errors/SectorOverflow.error"
import CurrentlyServicingPayload from "../interfaces/disk/CurrentlyServicingPayload.interface"
import { v4 as uuid } from "uuid"
import { padBuffer } from "../utils/BitBuffer.utils"

/**
 * Instructs the disk to write binary data (as Uint8Array)
 * to a particular sector.
 * @param sector The sector you wish to write to
 * @param data The data you wish to write to the requested sector (as Uint8Array)
 * @throws `SectorOverflowError` Data must be small enough to fit within the desired sector
 * @returns `CurrentlyServicingPayload` The data from the result of the write, indicating its completion.
 */
export const writeSector = async (
    sector: number,
    data: Uint8Array,
): Promise<CurrentlyServicingPayload> => {
    // Verify that the sector exists
    const state = store.getState()
    const sectors = selectSectors(state)
    const sectorSize = selectSectorSize(store.getState())
    const sectorBytes = sectorSize / 8

    if (sector < 0 || sector >= sectors.length) {
        throw new InvalidSectorError(
            `Total Sectors: ${sectors.length} (0 - ${
                sectors.length - 1
            }), Requested Sector: ${sector}`,
        )
    }

    // Guarantee the data can be written to the sector
    if (data.length > sectorBytes) {
        throw new SectorOverflowError(
            `Sector Size: ${sectorSize} bits (${sectorBytes} bytes), Data Size: ${data.length * 8} bits (${data.length} bytes)`,
        )
    }

    // The operation is valid. Add it to the disk queue.
    const id = uuid()

    // Pad the data to fill the entire sector
    const paddedData = padBuffer(data, sectorSize)

    store.dispatch(
        enqueue({
            type: "write",
            sectorNumber: sector,
            requestId: id,
            data: paddedData,
        }),
    )
    
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
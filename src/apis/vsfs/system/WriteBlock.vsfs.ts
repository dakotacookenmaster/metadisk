import { writeSector } from "../../disk/WriteSector.disk"
import { BlockOverflowError } from "../../api-errors/BlockOverflow.error"
import { selectSectorsPerBlock, selectTotalBlocks, selectSectorSize, selectBlockSize } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import WriteBlockPayload from "../../interfaces/vsfs/WriteBlockPayload.interface"
import { padBuffer, sliceBits } from "../../utils/BitBuffer.utils"
import { v4 as uuid } from "uuid"

/**
 * Writes a block to the disk.
 * @param block The block number to write to on the disk.
 * @param data The data to write to the block (as Uint8Array)
 * @param progressCb Optional progress callback.
 * @param appId Optional id of the originating app, forwarded to each
 *              underlying `writeSector` call so the disk simulator can
 *              attribute every queued sector access. Apps don't pass this
 *              themselves; it is injected by the `usePosix()` hook.
 * @returns
 */
export const writeBlock = async (
    block: number,
    data: Uint8Array,
    progressCb?: (progress: number, taskCount: number) => void,
    appId?: string,
): Promise<WriteBlockPayload> => {
    const state = store.getState()
    const sectorsPerBlock = selectSectorsPerBlock(state)
    const totalBlocks = selectTotalBlocks(state)
    const sectorSize = selectSectorSize(state)
    const blockSize = selectBlockSize(state)

    if (block < 0 || block >= totalBlocks) {
        throw new InvalidBlockAddressError(
            `Total blocks: ${totalBlocks}; Requested block: ${block}`,
        )
    }

    if (data.length * 8 > blockSize) {
        throw new BlockOverflowError(
            `Block size: ${blockSize} bits; Requested write: ${data.length * 8} bits`,
        )
    }

    // Pad the data to fill the entire block
    const paddedData = padBuffer(data, blockSize)

    let progress = 0

    // One opId per writeBlock call — stamped onto every sector payload so
    // the disk simulator can group them as a single bracketed operation,
    // independent of how the queue shifts as items are dequeued.
    const opId = uuid()

    const result = await Promise.all(
        [...Array(sectorsPerBlock)].map((_, i) => {
            // Slice the appropriate sector from the padded data
            const sectorData = sliceBits(paddedData, i * sectorSize, sectorSize)
            
            return writeSector(
                i + block * sectorsPerBlock,
                sectorData,
                appId,
                opId,
            ).then((data) => {
                if (progressCb) {
                    progress = progress + (1 / sectorsPerBlock) * 100
                    progressCb(progress, sectorsPerBlock)
                }
                return data
            })
        }),
    )

    return {
        sectors: result.map((payload) => payload.sectorNumber),
    }
}
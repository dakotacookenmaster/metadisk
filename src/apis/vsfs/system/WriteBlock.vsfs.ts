import { writeSector } from "../../disk/WriteSector.disk"
import { BlockOverflowError } from "../../api-errors/BlockOverflow.error"
import { selectSectorsPerBlock, selectTotalBlocks, selectSectorSize, selectBlockSize } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import WriteBlockPayload from "../../interfaces/vsfs/WriteBlockPayload.interface"
import { padBuffer, sliceBits } from "../../utils/BitBuffer.utils"

/**
 * Writes a block to the disk.
 * @param block The block number to write to on the disk.
 * @param data The data to write to the block (as Uint8Array)
 * @returns
 */
export const writeBlock = async (
    block: number,
    data: Uint8Array,
    progressCb?: (progress: number, taskCount: number) => void,
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

    const result = await Promise.all(
        [...Array(sectorsPerBlock)].map((_, i) => {
            // Slice the appropriate sector from the padded data
            const sectorData = sliceBits(paddedData, i * sectorSize, sectorSize)
            
            return writeSector(
                i + block * sectorsPerBlock,
                sectorData,
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
import { writeSector } from "../../disk/WriteSector.disk"
import { BlockOverflowError } from "../../api-errors/BlockOverflow.error"
import { selectSectorsPerBlock, selectTotalBlocks, selectSectorSize, selectBlockSize } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import WriteBlockPayload from "../../interfaces/vsfs/WriteBlockPayload.interface"
import Uint8ArrayChunk from "../../helpers/Uint8ArrayChunk.helper"
import { BlockUnderflowError } from "../../api-errors/BlockUnderflow.error"

/**
 * Writes a block to the disk.
 * @param block The block number to write to on the disk.
 * @param data The data to write to the block
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

    if ((data.length * 8) > blockSize) {
        throw new BlockOverflowError(
            `Block size: ${blockSize} bits; Requested write: ${data.length * 8} bits`,
        )
    }

    // Make sure that we have a full block to write, even if the
    // requested write was very small.
    const fullBlockBuffer = new Uint8Array(blockSize / 8)
    fullBlockBuffer.set(data)

    const dataChunks = Uint8ArrayChunk(fullBlockBuffer, sectorSize / 8)

    let progress = 0

    const result = await Promise.all(
        [...Array(sectorsPerBlock)].map((_, i) =>
            writeSector(
                i + block * sectorsPerBlock,
                dataChunks[i],
            ).then((data) => {
                if (progressCb) {
                    progress = progress + (1 / sectorsPerBlock) * 100
                    progressCb(progress, sectorsPerBlock)
                }
                return data
            }),
        ),
    )

    return {
        sectors: result.map((payload) => payload.sectorNumber),
    }
}
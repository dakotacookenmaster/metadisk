import { chunk } from "lodash"
import { writeSector } from "../../disk/WriteSector.disk"
import { BlockOverflowError } from "../../api-errors/BlockOverflow.error"
import { selectSectorsPerBlock, selectTotalBlocks, selectSectorSize, selectBlockSize } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import WriteBlockPayload from "../../interfaces/vsfs/WriteBlockPayload.interface"

/**
 * Writes a block to the disk.
 * @param block The block number to write to on the disk.
 * @param data The data to write to the block
 * @returns
 */
export const writeBlock = async (
    block: number,
    data: string,
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

    if (data.length > blockSize) {
        throw new BlockOverflowError(
            `Block size: ${blockSize} bits; Requested write: ${data.length} bits`,
        )
    }

    const dataChunks = chunk(data.split(""), sectorSize)

    let progress = 0

    const result = await Promise.all(
        [...Array(sectorsPerBlock)].map((_, i) =>
            writeSector(
                i + block * sectorsPerBlock,
                i >= dataChunks.length ? "" : dataChunks[i].join(""),
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
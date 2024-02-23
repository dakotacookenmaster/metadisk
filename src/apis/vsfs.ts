import { chunk } from "lodash"
import {
    selectSectorSize,
    selectSectorsPerBlock,
    selectTotalBlocks,
} from "../redux/reducers/fileSystemSlice"
import { store } from "../store"
import { BlockOverflowError } from "./api-errors/BlockOverflow.error"
import { InvalidBlockAddressError } from "./api-errors/InvalidBlockAddress.error"
import { readSector, writeSector } from "./disk"
import { BadDataLengthError } from "./api-errors/BadDataLength.error"

interface ReadBlockPayload {
    data: string
    sectors: number[]
}

interface WriteBlockPayload {
    sectors: number[]
}

/**
 * Reads a block from the disk.
 * @param block The block number to read from the disk
 */
export const readBlock = async (
    block: number,
    progressCb?: (progress: number) => void,
): Promise<ReadBlockPayload> => {
    const sectorsPerBlock = selectSectorsPerBlock(store.getState())
    const totalBlocks = selectTotalBlocks(store.getState())

    if (block < 0 || block >= totalBlocks) {
        throw new InvalidBlockAddressError(
            `Total blocks: ${totalBlocks}; Requested block: ${block}.`,
        )
    }

    let progress = 0

    const result = await Promise.all(
        [...Array(sectorsPerBlock)].map((_, i) =>
            readSector(i + block * sectorsPerBlock).then((data) => {
                if (progressCb) {
                    progress = progress + (1 / sectorsPerBlock) * 100
                    progressCb(progress)
                }

                return data
            }),
        ),
    )

    return {
        data: result.map((payload) => payload.data).join(""),
        sectors: result.map((payload) => payload.sectorNumber),
    }
}

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
    const sectorsPerBlock = selectSectorsPerBlock(store.getState())
    const totalBlocks = selectTotalBlocks(store.getState())
    const sectorSize = selectSectorSize(store.getState())
    const blockSize = sectorSize * sectorsPerBlock

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

/**
 * Allows the reading of multiple blocks, providing a callback to update the invoker on progress
 * @param blocks The block numbers you want to read.
 * @param progressCb A callback you can provide to allow updates based on computed progress.
 * @returns
 */
export const readBlocks = async (
    blocks: number[],
    progressCb?: (progress: number) => void,
) => {
    let totalCompleted = 0
    const operations = []
    for (let block of blocks) {
        operations.push(
            readBlock(block, (progress) => {
                totalCompleted++
                if (progressCb) {
                    progressCb(
                        ((totalCompleted + progress / 100) / blocks.length) * 100,
                    )
                }
            }).then(result => {
                totalCompleted++
                return result
            }),
        )
    }
    const result = await Promise.all(operations)
    return result
}

/**
 * Allows the writing of multiple blocks, providing a callback to update the invoker on progress
 * @param blocks The block numbers you want to read.
 * @param data The data you wish to write to the blocks.
 * @param progressCb A callback you can provide to allow updates based on computed progress.
 * @returns
 */
export const writeBlocks = async (
    blocks: number[],
    data: string[],
    progressCb?: (progress: number) => void,
) => {
    let totalCompleted = 0
    const operations = []
    if (blocks.length !== data.length) {
        throw new BadDataLengthError(
            `Block length: ${blocks.length}; Data length: ${data.length}`,
        )
    }

    for (let i = 0; i < blocks.length; i++) {
        operations.push(
            writeBlock(blocks[i], data[i], (progress) => {
                if (progressCb) {
                    progressCb(
                        ((totalCompleted + (progress / 100)) / blocks.length) * 100,
                    )
                }
            }).then((result) => {
                totalCompleted++
                return result
            }),
        )
    }

    const result = await Promise.all(operations)
    return result
}

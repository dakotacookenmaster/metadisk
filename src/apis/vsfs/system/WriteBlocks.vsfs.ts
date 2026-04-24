import { BadDataLengthError } from "../../api-errors/BadDataLength.error"
import { writeBlock } from "./BlockCache.vsfs"

/**
 * Allows the writing of multiple blocks, providing a callback to update the invoker on progress
 * @param blocks The block numbers you want to read.
 * @param data The data you wish to write to the blocks (as Uint8Array[]).
 * @param progressCb A callback you can provide to allow updates based on computed progress.
 * @param appId Optional id of the originating app, forwarded to each
 *              underlying `writeBlock` so the disk simulator can attribute
 *              every queued sector access. Apps don't pass this themselves;
 *              it is injected by the `usePosix()` hook.
 * @returns
 */
export const writeBlocks = async (
    blocks: number[],
    data: Uint8Array[],
    progressCb?: (progress: number) => void,
    appId?: string,
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
                        ((totalCompleted + progress / 100) / blocks.length) *
                            100,
                    )
                }
            }, appId).then((result) => {
                totalCompleted++
                return result
            }),
        )
    }

    const result = await Promise.all(operations)
    return result
}
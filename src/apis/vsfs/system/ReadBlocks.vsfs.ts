import ReadBlockPayload from "../../interfaces/vsfs/ReadBlockPayload.interface"
import { readBlock } from "./BlockCache.vsfs"

/**
 * Allows the reading of multiple blocks, providing a callback to update the invoker on progress
 * @param blocks The block numbers you want to read.
 * @param progressCb A callback you can provide to allow updates based on computed progress.
 * @param appId Optional id of the originating app, forwarded to each
 *              underlying `readBlock` so the disk simulator can attribute
 *              every queued sector access. Apps don't pass this themselves;
 *              it is injected by the `usePosix()` hook.
 * @returns
 */
export const readBlocks = async (
    blocks: number[],
    progressCb?: (progress: number) => void,
    appId?: string,
): Promise<ReadBlockPayload[]> => {
    let totalCompleted = 0
    const operations = []
    for (const block of blocks) {
        operations.push(
            readBlock(block, (progress) => {
                totalCompleted++
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
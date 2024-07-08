import ReadBlockPayload from "../../interfaces/vsfs/ReadBlockPayload.interface"
import { readBlock } from "./ReadBlock.vsfs"

/**
 * Allows the reading of multiple blocks, providing a callback to update the invoker on progress
 * @param blocks The block numbers you want to read.
 * @param progressCb A callback you can provide to allow updates based on computed progress.
 * @returns
 */
export const readBlocks = async (
    blocks: number[],
    progressCb?: (progress: number) => void,
): Promise<ReadBlockPayload[]> => {
    let totalCompleted = 0
    const operations = []
    for (let block of blocks) {
        operations.push(
            readBlock(block, (progress) => {
                totalCompleted++
                if (progressCb) {
                    progressCb(
                        ((totalCompleted + progress / 100) / blocks.length) *
                            100,
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
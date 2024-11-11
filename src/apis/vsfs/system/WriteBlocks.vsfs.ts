import { BadDataLengthError } from "../../api-errors/BadDataLength.error"
import { writeBlock } from "./WriteBlock.vsfs"

/**
 * Allows the writing of multiple blocks, providing a callback to update the invoker on progress
 * @param blocks The block numbers you want to read.
 * @param data The data you wish to write to the blocks.
 * @param progressCb A callback you can provide to allow updates based on computed progress.
 * @returns
 */
export const writeBlocks = async (
    blocks: number[],
    data: Uint8Array[],
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
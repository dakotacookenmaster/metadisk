import { readBlock, writeBlock } from "./BlockCache.vsfs";
import { writeBits } from "../../utils/BitBuffer.utils";

/**
 * @param appId Optional id of the originating app, forwarded so the
 *              underlying read/write of the bitmap block can be attributed
 *              in the disk simulator. Apps don't pass this themselves; it
 *              is injected by the `usePosix()` hook.
 */
export default async function updateBitmap(which: "inode" | "data", index: number, value: "0" | "1", appId?: string): Promise<void> {
    const blockNumber = which === "inode" ? 1 : 2
    const bitmap = (await readBlock(blockNumber, undefined, appId)).data.raw
    
    // Update the bit at the specified index
    const bitValue = value === "1" ? 1 : 0
    writeBits(bitmap, bitValue, index, 1)
    
    await writeBlock(blockNumber, bitmap, undefined, appId)
}
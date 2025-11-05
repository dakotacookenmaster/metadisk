import { readBlock, writeBlock } from "./BlockCache.vsfs";
import { writeBits } from "../../utils/BitBuffer.utils";

export default async function updateBitmap(which: "inode" | "data", index: number, value: "0" | "1"): Promise<void> {
    const blockNumber = which === "inode" ? 1 : 2
    const bitmap = (await readBlock(blockNumber)).data.raw
    
    // Update the bit at the specified index
    const bitValue = value === "1" ? 1 : 0
    writeBits(bitmap, bitValue, index, 1)
    
    await writeBlock(blockNumber, bitmap)
}
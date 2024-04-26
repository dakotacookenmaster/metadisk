import { readBlock } from "./ReadBlock.vsfs";
import { writeBlock } from "./WriteBlock.vsfs";

export default async function updateBitmap(which: "inode" | "data", index: number, value: "0" | "1"): Promise<void> {
    if(which === "inode") {
        const inodeBitmap = (await readBlock(1)).data.raw.split('')
        inodeBitmap[index] = value
        await writeBlock(1, inodeBitmap.join(''))
    } else {
        const dataBitmap = (await readBlock(2)).data.raw.split('')
        dataBitmap[index] = value
        await writeBlock(2, dataBitmap.join(''))
    }
}
import { readBlock } from "./ReadBlock.vsfs";
import { writeBlock } from "./WriteBlock.vsfs";

export default async function updateBitmap(which: "inode" | "data", index: number, value: 0 | 1): Promise<void> {
    console.log("INDEX:", index)
    if(which === "inode") {
        const inodeBitmap = (await readBlock(1)).data.raw

        const bufferIndex = Math.floor((inodeBitmap.length * 8) / index)
        // console.log("INDEX:", bufferIndex)
        const newValue = ((value << (7 - index)) | 0xFF) & inodeBitmap[bufferIndex]
        inodeBitmap[bufferIndex] = newValue
        console.log("UPDATED INODE:", inodeBitmap)
        await writeBlock(1, inodeBitmap)
    } else {
        const dataBitmap = (await readBlock(2)).data.raw
        const bufferIndex = Math.floor((dataBitmap.length * 8) / index)
        const newValue = ((value << (7 - index)) | 0xFF) & dataBitmap[bufferIndex]
        dataBitmap[bufferIndex] = newValue
        console.log("UPDATED DATA:", dataBitmap)
        await writeBlock(2, dataBitmap)
    }
}
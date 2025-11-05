import { getCharacterEncoding } from "../../../apps/vsfs/components/Viewers"
import { selectBlockSize } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { DirectoryBlockOverflowError } from "../../api-errors/DirectoryBlockOverflow.error"
import { FilenameTooLongError } from "../../api-errors/FilenameTooLong.error"
import BuildDirectoryData from "../../interfaces/vsfs/BuildDirectoryData.interface"
import { writeBits, createBuffer } from "../../utils/BitBuffer.utils"

/**
 * Builds the binary representation of a directory as Uint8Array
 * @param directory The directory data
 * @returns Uint8Array containing directory entries
 */
export default function buildDirectory(directory: BuildDirectoryData): Uint8Array {
    const maxEntries = selectBlockSize(store.getState()) / 128 // the max number of entries per block
    
    if(directory.entries.length > maxEntries) {
        throw new DirectoryBlockOverflowError()
    }
    
    // Each entry is 128 bits (104 bits for name + 24 bits for inode)
    const totalBits = directory.entries.length * 128
    const buffer = createBuffer(totalBits)
    
    let bitOffset = 0
    
    for (const entry of directory.entries) {
        if (entry.name.length > 13) {
            throw new FilenameTooLongError()
        }

        // Write name (104 bits = 13 characters * 8 bits each)
        for (let i = 0; i < 13; i++) {
            if (i < entry.name.length) {
                const charCode = getCharacterEncoding(entry.name[i])
                writeBits(buffer, charCode, bitOffset, 8)
            } else {
                // Pad with zeros
                writeBits(buffer, 0, bitOffset, 8)
            }
            bitOffset += 8
        }
        
        // Write inode number (24 bits)
        writeBits(buffer, entry.inode, bitOffset, 24)
        bitOffset += 24
    }

    return buffer
}

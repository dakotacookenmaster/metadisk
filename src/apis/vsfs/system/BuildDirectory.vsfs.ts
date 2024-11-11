import { getCharacterEncoding } from "../../../apps/vsfs/components/Viewers"
import { selectBlockSize } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { DirectoryBlockOverflowError } from "../../api-errors/DirectoryBlockOverflow.error"
import { FilenameTooLongError } from "../../api-errors/FilenameTooLong.error"
import BuildDirectoryData from "../../interfaces/vsfs/BuildDirectoryData.interface"

/**
 * Builds the bitstring representation of a directory
 * @param directory The directory data
 * @returns 
 */
export default function buildDirectory(directory: BuildDirectoryData): Uint8Array {
    const maxEntries = selectBlockSize(store.getState()) / 128 // the max number of entries per block
    if(directory.entries.length > maxEntries) {
        throw new DirectoryBlockOverflowError()
    }

    const entries = new Uint8Array(directory.entries.length * 16) // it takes 16 bytes to represent a directory entry

    for(let i = 0; i < directory.entries.length; i++) {
        const entry = directory.entries[i]
        if (entry.name.length > 13) {
            throw new FilenameTooLongError()
        }

        // get an array of the numeric encodings
        // for each ASCII character. These are the first
        // 13 bytes of the entry
        const name = entry.name
            .split("")
            .map((char) => {
                return getCharacterEncoding(char)
            })


        // the last 3 bytes of the entry are the inode it points to
        const inode = entry.inode

        // set these values in the array buffer
        entries.set(name, i * 16)
        entries[(i * 16) + 13] = inode >> 16
        entries[(i * 16) + 14] = (inode >> 8) & 0xFF
        entries[(i * 16) + 15] = inode & 0xFF
    }

    return entries
}

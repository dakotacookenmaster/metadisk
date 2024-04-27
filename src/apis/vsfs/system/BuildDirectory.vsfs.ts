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
export default function buildDirectory(directory: BuildDirectoryData): string {
    const maxEntries = selectBlockSize(store.getState()) / 128 // the max number of entries per block
    const entries = []
    if(directory.entries.length > maxEntries) {
        throw new DirectoryBlockOverflowError()
    }
    for (let entry of directory.entries) {
        if (entry.name.length > 13) {
            throw new FilenameTooLongError()
        }

        const name = entry.name
            .split("")
            .map((char) => {
                return getCharacterEncoding(char).toString(2).padStart(8, "0")
            })
            .join("")
            .padStart(104, "0")
        const inode = entry.inode.toString(2).padStart(24, "0")

        entries.push(name + inode)
    }

    return entries.join("")
}

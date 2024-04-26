import { getCharacterEncoding } from "../../../apps/vsfs/components/Viewers"
import { FilenameTooLongError } from "../../api-errors/FilenameTooLong.error"
import BuildDirectoryData from "../../interfaces/vsfs/BuildDirectoryData.interface"

export default function buildDirectory(directory: BuildDirectoryData) {
    const entries = []
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

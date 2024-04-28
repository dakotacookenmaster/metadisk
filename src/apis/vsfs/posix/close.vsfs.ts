import { removeFileDescriptor, selectFileDescriptorTable } from "../../../redux/reducers/fileSystemSlice";
import { store } from "../../../store";
import { InvalidFileDescriptorError } from "../../api-errors/InvalidFileDescriptor.error";

/**
 * Closes a file by removing the entry from the file descriptor table
 * @param fileDescriptor The file you wish to close
 */
export default function close(fileDescriptor: number) {
    const fileDescriptorTable = selectFileDescriptorTable(store.getState())
    if(fileDescriptor < 0 || fileDescriptor > fileDescriptorTable.length - 1) {
        throw new InvalidFileDescriptorError()
    }

    store.dispatch(removeFileDescriptor(fileDescriptor))
}
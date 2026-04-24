import { removeFileDescriptor, selectFileDescriptorTable } from "../../../redux/reducers/fileSystemSlice";
import { store } from "../../../store";
import { InvalidFileDescriptorError } from "../../api-errors/InvalidFileDescriptor.error";

/**
 * Closes a file by removing the entry from the file descriptor table.
 *
 * NOTE: `appId` is unused here because closing a file does not touch the
 * disk — it only mutates the in-memory file descriptor table. The parameter
 * is accepted for signature consistency with the rest of the POSIX API so
 * the `usePosix()` hook can curry it uniformly.
 */
export default function close(fileDescriptor: number, _appId?: string) {
    void _appId
    const fileDescriptorTable = selectFileDescriptorTable(store.getState())
    if(fileDescriptor < 0 || fileDescriptor > fileDescriptorTable.length - 1) {
        throw new InvalidFileDescriptorError()
    }

    store.dispatch(removeFileDescriptor(fileDescriptor))
}
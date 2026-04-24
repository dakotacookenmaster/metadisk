import { selectFileDescriptorTable } from "../../../redux/reducers/fileSystemSlice";
import { store } from "../../../store";
import { AccessDeniedError } from "../../api-errors/AccessDenied.error";
import { InvalidFileDescriptorError } from "../../api-errors/InvalidFileDescriptor.error";
import OpenFlags from "../../enums/vsfs/OpenFlags.enum";
import getInodeLocation from "../system/GetInodeLocation.vsfs";
import { readBlock } from "../system/BlockCache.vsfs";
import { concatBuffers } from "../../utils/BitBuffer.utils";

/**
 * A POSIX-like function that reads a file, given a file descriptor.
 * @param fileDescriptor The file descriptor for the file to read from
 * @param appId Optional originating app id, forwarded to every underlying
 *              `readBlock` so the disk simulator can attribute each queued
 *              sector to the calling app. Apps don't pass this themselves;
 *              it is injected by the `usePosix()` hook.
 * @throws InvalidFileDescriptorError
 * @throws AccessDeniedError
 * @returns The file data as Uint8Array
 */
export default async function read(fileDescriptor: number, appId?: string): Promise<Uint8Array> {
    const fileDescriptorTable = selectFileDescriptorTable(store.getState())
    if(fileDescriptor < 0 || fileDescriptor > fileDescriptorTable.length - 1) {
        throw new InvalidFileDescriptorError()
    }

    /* c8 ignore start */
    if(fileDescriptor === 0) {
        // this is for stdin
    } else if(fileDescriptor === 1) {
        // this is for stdout
    } else if(fileDescriptor === 2) {
        // this is for stderr
    }
    /* c8 ignore stop */

    const descriptor = fileDescriptorTable[fileDescriptor]! // at this point, you know it's not null

    // we need to open for reading. Does this file descriptor have the right permissions?
    if([OpenFlags.O_RDONLY, OpenFlags.O_RDWR].includes(descriptor.mode)) {
        // we can open the file for reading because the permissions are legitimate
        const { inodeBlock, inodeOffset } = getInodeLocation(descriptor.inode)
        const inode = (await readBlock(inodeBlock, undefined, appId)).data.inodes[inodeOffset]
        const dataBlocks = await Promise.all(
            inode.blockPointers.filter(v => v).map(async pointer => {
                // for non-null pointer in the file, read the contents
                return (await readBlock(pointer, undefined, appId)).data.raw
            })
        )

        return concatBuffers(dataBlocks)
    } else {
        // this file doesn't allow reading
        throw new AccessDeniedError()
    }
}
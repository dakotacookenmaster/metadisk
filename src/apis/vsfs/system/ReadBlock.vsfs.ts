import { selectBlockSize, selectSectorsPerBlock, selectSuperblock, selectTotalBlocks } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import ReadBlockPayload from "../../interfaces/vsfs/ReadBlockPayload.interface"
import { getCharacter } from "../../../apps/vsfs/components/Viewers"
import { readSector } from "../../disk/ReadSector.disk"
import Permissions from "../../enums/vsfs/Permissions.enum"
import { readBits, concatBuffers } from "../../utils/BitBuffer.utils"
import { v4 as uuid } from "uuid"

/**
 * Reads a block from the disk.
 * @param block The block number to read from the disk
 * @param progressCb Optional progress callback (0–100).
 * @param appId Optional id of the originating app, forwarded to each
 *              underlying `readSector` call so the disk simulator can
 *              attribute every queued sector access. Apps don't pass this
 *              themselves; it is injected by the `usePosix()` hook.
 */
export const readBlock = async (
    block: number,
    progressCb?: (progress: number) => void,
    appId?: string,
): Promise<ReadBlockPayload> => {
    const state = store.getState()
    const sectorsPerBlock = selectSectorsPerBlock(state)
    const totalBlocks = selectTotalBlocks(state)
    const blockSize = selectBlockSize(state)
    const {inodeSize, inodeStartIndex} = selectSuperblock(state)
    const inodesPerBlock = blockSize / inodeSize

    if (block < 0 || block >= totalBlocks) {
        throw new InvalidBlockAddressError(
            `Total blocks: ${totalBlocks}; Requested block: ${block}.`,
        )
    }

    let progress = 0

    // One opId per readBlock call — stamped onto every sector payload so
    // the disk simulator can group them as a single bracketed operation,
    // independent of how the queue shifts as items are dequeued.
    const opId = uuid()

    const result = await Promise.all(
        [...Array(sectorsPerBlock)].map((_, i) =>
            readSector(i + block * sectorsPerBlock, appId, opId).then((data) => {
                if (progressCb) {
                    progress = progress + (1 / sectorsPerBlock) * 100
                    progressCb(progress)
                }

                return data
            }),
        ),
    )

    // Concatenate all sector data into one buffer
    const rawData = concatBuffers(result.map(payload => payload.data!))
    const sectors = result.map(payload => payload.sectorNumber)

    // Parse superblock (56 bits)
    let bitOffset = 0
    const magicNumber = readBits(rawData, bitOffset, 8)
    bitOffset += 8
    const inodeCount = readBits(rawData, bitOffset, 16)
    bitOffset += 16
    const inodeBlocks = readBits(rawData, bitOffset, 4)
    bitOffset += 4
    const dataBlocks = readBits(rawData, bitOffset, 4)
    bitOffset += 4
    const blockSizeFromSuperblock = readBits(rawData, bitOffset, 24)

    // Parse directory entries (each entry is 128 bits)
    const numEntries = blockSize / 128
    const entries = []
    for (let i = 0; i < numEntries; i++) {
        const entryOffset = i * 128
        
        // Read name (104 bits = 13 characters)
        let name = ""
        for (let j = 0; j < 13; j++) {
            const charCode = readBits(rawData, entryOffset + (j * 8), 8)
            if (charCode !== 0) {
                name += getCharacter(charCode)
            }
        }
        
        // Read inode (24 bits)
        const inodeNum = readBits(rawData, entryOffset + 104, 24)
        
        entries.push({
            name,
            inode: inodeNum,
            free: name === ""
        })
    }

    // Parse inodes (each inode is 128 bits)
    const inodes = []
    for (let i = 0; i < inodesPerBlock; i++) {
        const inodeOffset = i * 128
        
        // Type: 2 bits
        const typeValue = readBits(rawData, inodeOffset, 2)
        const type: "file" | "directory" = typeValue === 0b00 ? "file" : "directory"
        
        // Permissions: 6 bits
        const permissionsValue = readBits(rawData, inodeOffset + 2, 6)
        const permissionsBinary = permissionsValue.toString(2).padStart(6, "0")
        const permissions = permissionsBinary as Permissions
        
        // Size: 24 bits
        const size = readBits(rawData, inodeOffset + 8, 24)
        
        // Created at: 32 bits
        const createdAtSeconds = readBits(rawData, inodeOffset + 32, 32)
        const createdAt = new Date(createdAtSeconds * 1000)
        
        // Last modified: 32 bits
        const lastModifiedSeconds = readBits(rawData, inodeOffset + 64, 32)
        const lastModified = new Date(lastModifiedSeconds * 1000)
        
        // Block pointers: 8 pointers of 4 bits each
        const blockPointers = []
        for (let j = 0; j < 8; j++) {
            const pointer = readBits(rawData, inodeOffset + 96 + (j * 4), 4)
            blockPointers.push(pointer)
        }
        
        inodes.push({
            inode: (inodesPerBlock * (block - inodeStartIndex)) + i,
            permissions,
            type,
            size,
            createdAt,
            lastModified,
            blockPointers
        })
    }

    return {
        data: {
            superblock: {
                magicNumber,
                inodeCount,
                inodeBlocks,
                dataBlocks,
                blockSize: blockSizeFromSuperblock
            },
            directory: {
                entries
            },
            inodes,
            raw: rawData,
        },
        sectors
    }
}

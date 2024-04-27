import { chunk } from "lodash"
import { selectBlockSize, selectSectorsPerBlock, selectSuperblock, selectTotalBlocks } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import ReadBlockPayload from "../../interfaces/vsfs/ReadBlockPayload.interface"
import { convertBinaryByteStringToType } from "../../../apps/vsfs/components/Viewers"
import { readSector } from "../../disk/ReadSector.disk"
import Permissions from "../../enums/vsfs/Permissions.enum"

/**
 * Reads a block from the disk.
 * @param block The block number to read from the disk
 */
export const readBlock = async (
    block: number,
    progressCb?: (progress: number) => void,
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

    // FIXME - handle errors with Promise.all
    const result = await Promise.all(
        [...Array(sectorsPerBlock)].map((_, i) =>
            readSector(i + block * sectorsPerBlock).then((data) => {
                if (progressCb) {
                    progress = progress + (1 / sectorsPerBlock) * 100
                    progressCb(progress)
                }

                return data
            }),
        ),
    )

    const rawData = result.map(payload => payload.data).join('')
    const sectors = result.map(payload => payload.sectorNumber)

    return {
        data: {
            superblock: {
                magicNumber: parseInt(rawData.slice(0, 8), 2), // the first byte is the magic number
                inodeCount: parseInt(rawData.slice(8, 24), 2), // the second byte is the number of inodes
                inodeBlocks: parseInt(rawData.slice(24, 28), 2), // the next nibble is the number of inode blocks
                dataBlocks: parseInt(rawData.slice(28, 32), 2), // the next nibble is the number of data blocks
                blockSize: parseInt(rawData.slice(32, 56), 2) // the last 3 bytes are the block size
            },

            directory: {
                entries: chunk(rawData, 128).map(entry => {
                    const name = chunk(entry.join('').slice(0, 104), 8).map(char => convertBinaryByteStringToType(char.join(''), "ascii")).join('').replaceAll("\uE400", "")
                    return {
                        name,
                        inode: parseInt(entry.join('').slice(104, 128), 2),
                        free: name === "" // if it has no name, it's a free space
                    }
                })
            },
            inodes: chunk(rawData, 128).map((inode, index) => {
                return {
                    inode: (inodesPerBlock * (block - inodeStartIndex)) + index, // assuming this is an inode block, where inode blocks start at inodeStartIndex
                    permissions: [inode.join('').slice(2, 4), inode.join('').slice(4, 6), inode.join('').slice(6, 8)].join('') as Permissions,
                    type: inode.join('').slice(0, 2) === "00" ? "file" : "directory" as "file" | "directory",
                    size: parseInt(inode.join('').slice(8, 32), 2),
                    createdAt: new Date(parseInt(inode.join('').slice(32, 64), 2) * 1000),
                    lastModified: new Date(parseInt(inode.join('').slice(64, 96), 2) * 1000),
                    blockPointers: chunk(inode.join('').slice(96, 128), 4).map(pointer => parseInt(pointer.join(''), 2))
                }
            }),
            raw: rawData,
        },
        sectors
    }
}

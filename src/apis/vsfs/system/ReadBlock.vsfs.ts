import { selectBlockSize, selectSectorSize, selectSectorsPerBlock, selectSuperblock, selectTotalBlocks } from "../../../redux/reducers/fileSystemSlice"
import { store } from "../../../store"
import { InvalidBlockAddressError } from "../../api-errors/InvalidBlockAddress.error"
import ReadBlockPayload from "../../interfaces/vsfs/ReadBlockPayload.interface"
import { getCharacter } from "../../../apps/vsfs/components/Viewers"
import { readSector } from "../../disk/ReadSector.disk"
import Uint8ArrayChunk from "../../helpers/Uint8ArrayChunk.helper"

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
    const sectorSize = selectSectorSize(state)
    const {inodeSize, inodeStartIndex} = selectSuperblock(state)
    const inodesPerBlock = blockSize / inodeSize

    if (block < 0 || block >= totalBlocks) {
        throw new InvalidBlockAddressError(
            `Total blocks: ${totalBlocks}; Requested block: ${block}.`,
        )
    }

    let progress = 0

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

    // create a new array buffer that contains the contents
    // of each sector to create a unified "block" in memory
    const rawBlockData = new Uint8Array((sectorSize / 8) * result.length)

    // copy each array buffer from the read sectors into the new
    // unified block buffer
    
    for(let i = 0; i < result.length; i++) {
        rawBlockData.set(result[i].data, i * (sectorSize / 8))
    }
 
    const sectors = result.map(payload => payload.sectorNumber)

    return {
        data: {
            superblock: {
                magicNumber: rawBlockData[0],
                inodeCount: (rawBlockData[1] << 8) | (rawBlockData[2]), // the next two bytes represent the number of inodes
                inodeBlocks: rawBlockData[3] >> 4, // the next nibble is the number of inode blocks
                dataBlocks: rawBlockData[3] & 0xF, // the next nibble is the number of data blocks
                blockSize: (rawBlockData[4] << 16) | (rawBlockData[5]) << 8 | rawBlockData[6], // the last 3 bytes are the block size
            },

            directory: {
                entries: Uint8ArrayChunk(rawBlockData, 16).map(entry => {
                    // grab the first 13 bytes, which represents the 13 characters in the entry name
                    // Then, convert those to ASCII CP-437 values
                    const nameView = entry.slice(0, 13)
                    const name = nameView.reduce((acc, val) => {
                        return acc + getCharacter(val)
                    }, "").replaceAll("\uE400", "")

                    // the last 3 bytes are the inode this entry refers to
                    const inodeView = entry.slice(13, 16)
                    const inode = inodeView.reduce((acc, val, index) => {
                        return (acc | (val << (8 * (2 - index))))
                    }, 0)

                    return {
                        name,
                        inode,
                        free: name === "" // if it has no name, it's a free space
                    }
                })
            },
            inodes: Uint8ArrayChunk(rawBlockData, 16).map((array, index) => {
                return {
                    inode: (inodesPerBlock * (block - inodeStartIndex)) + index, // assuming this is an inode block, where inode blocks start at inodeStartIndex
                    type: array[0] >> 6 === 0 ? "file" : "directory", // the first two bits are the file type
                    permissions: array[0] & 0x3F, // the next six bits are the permissions
                    size: (array[1] << 16) | (array[2] << 8) | array[3], // the next 3 bytes are the inode size
                    createdAt: new Date(((array[4] << 24) | (array[5] << 16) | (array[6] << 8) | array[7]) * 1000), // the next 4 bytes are the createdAt date
                    lastModified: new Date(((array[8] << 24) | (array[9] << 16) | (array[10] << 8) | array[11]) * 1000), // the next 4 bytes are the lastModified date
                    blockPointers: [
                        array[12] >> 4,
                        array[12] & 0xF,
                        array[13] >> 4,
                        array[13] & 0xF,
                        array[14] >> 4,
                        array[14] & 0xF,
                        array[15] >> 4,
                        array[15] & 0xF,
                    ] // 8 block pointers, where each pointer is a nibble
                }
            }),
            raw: rawBlockData,
        },
        sectors
    }
}

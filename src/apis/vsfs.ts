import { chunk } from "lodash"
import {
    addFileDescriptor,
    selectBlockSize,
    selectFileDescriptorTable,
    selectSectorSize,
    selectSectorsPerBlock,
    selectSuperblock,
    selectTotalBlocks,
} from "../redux/reducers/fileSystemSlice"
import { store } from "../store"
import { BlockOverflowError } from "./api-errors/BlockOverflow.error"
import { InvalidBlockAddressError } from "./api-errors/InvalidBlockAddress.error"
import { readSector, writeSector } from "./disk"
import { BadDataLengthError } from "./api-errors/BadDataLength.error"
import { InvalidPathError } from "./api-errors/InvalidPath.error"
import { FilenameTooLongError } from "./api-errors/FilenameTooLong.error"
import {
    convertBinaryByteStringToType,
    getCharacterEncoding,
} from "../apps/vsfs/components/Viewers"

interface ReadBlockPayload {
    data: string
    sectors: number[]
}

interface WriteBlockPayload {
    sectors: number[]
}

/**
 * Reads a block from the disk.
 * @param block The block number to read from the disk
 */
export const readBlock = async (
    block: number,
    progressCb?: (progress: number) => void,
): Promise<ReadBlockPayload> => {
    const sectorsPerBlock = selectSectorsPerBlock(store.getState())
    const totalBlocks = selectTotalBlocks(store.getState())

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

    return {
        data: result.map((payload) => payload.data).join(""),
        sectors: result.map((payload) => payload.sectorNumber),
    }
}

/**
 * Writes a block to the disk.
 * @param block The block number to write to on the disk.
 * @param data The data to write to the block
 * @returns
 */
export const writeBlock = async (
    block: number,
    data: string,
    progressCb?: (progress: number, taskCount: number) => void,
): Promise<WriteBlockPayload> => {
    const sectorsPerBlock = selectSectorsPerBlock(store.getState())
    const totalBlocks = selectTotalBlocks(store.getState())
    const sectorSize = selectSectorSize(store.getState())
    const blockSize = sectorSize * sectorsPerBlock

    if (block < 0 || block >= totalBlocks) {
        throw new InvalidBlockAddressError(
            `Total blocks: ${totalBlocks}; Requested block: ${block}`,
        )
    }

    if (data.length > blockSize) {
        throw new BlockOverflowError(
            `Block size: ${blockSize} bits; Requested write: ${data.length} bits`,
        )
    }

    const dataChunks = chunk(data.split(""), sectorSize)

    let progress = 0

    const result = await Promise.all(
        [...Array(sectorsPerBlock)].map((_, i) =>
            writeSector(
                i + block * sectorsPerBlock,
                i >= dataChunks.length ? "" : dataChunks[i].join(""),
            ).then((data) => {
                if (progressCb) {
                    progress = progress + (1 / sectorsPerBlock) * 100
                    progressCb(progress, sectorsPerBlock)
                }
                return data
            }),
        ),
    )

    return {
        sectors: result.map((payload) => payload.sectorNumber),
    }
}

/**
 * Allows the reading of multiple blocks, providing a callback to update the invoker on progress
 * @param blocks The block numbers you want to read.
 * @param progressCb A callback you can provide to allow updates based on computed progress.
 * @returns
 */
export const readBlocks = async (
    blocks: number[],
    progressCb?: (progress: number) => void,
) => {
    let totalCompleted = 0
    const operations = []
    for (let block of blocks) {
        operations.push(
            readBlock(block, (progress) => {
                totalCompleted++
                if (progressCb) {
                    progressCb(
                        ((totalCompleted + progress / 100) / blocks.length) *
                            100,
                    )
                }
            }).then((result) => {
                totalCompleted++
                return result
            }),
        )
    }
    const result = await Promise.all(operations)
    return result
}

/**
 * Allows the writing of multiple blocks, providing a callback to update the invoker on progress
 * @param blocks The block numbers you want to read.
 * @param data The data you wish to write to the blocks.
 * @param progressCb A callback you can provide to allow updates based on computed progress.
 * @returns
 */
export const writeBlocks = async (
    blocks: number[],
    data: string[],
    progressCb?: (progress: number) => void,
) => {
    let totalCompleted = 0
    const operations = []
    if (blocks.length !== data.length) {
        throw new BadDataLengthError(
            `Block length: ${blocks.length}; Data length: ${data.length}`,
        )
    }

    for (let i = 0; i < blocks.length; i++) {
        operations.push(
            writeBlock(blocks[i], data[i], (progress) => {
                if (progressCb) {
                    progressCb(
                        ((totalCompleted + progress / 100) / blocks.length) *
                            100,
                    )
                }
            }).then((result) => {
                totalCompleted++
                return result
            }),
        )
    }

    const result = await Promise.all(operations)
    return result
}

/**
 * O_WRONLY instructs the handler to open the file for writing.
 * O_CREAT instructs the handler to create the file if it doesn't exist
 */
export enum OpenFlags {
    /* Something here */
    O_WRONLY,
    O_CREAT,
}

export enum Permissions {
    None = "000000",
    Read = "010000",
    Write = "000100",
    Execute = "000001",
    ReadWrite = "010100",
    ReadExecute = "010001",
    WriteExecute = "000101",
    ReadWriteExecute = "010101",
}

interface DirectoryData {
    name: string
    inode: number
}

interface Listing {
    entries: DirectoryData[]
}

const readDirectories = (blockData: string): Listing => {
    const entries = []
    const directories = chunk(blockData.split(""), 128).map((directoryData) =>
        directoryData.join(""),
    )

    for (let directory of directories) {
        const name = chunk(directory.slice(0, 104).split(""), 8)
            .map((bits) =>
                convertBinaryByteStringToType(bits.join(""), "ascii"),
            )
            .filter((char) => char !== "\uE400")
            .join("")

        if (name === "") {
            break
        }

        entries.push({
            name,
            inode: parseInt(directory.slice(104, 128), 2),
        })
    }

    return {
        entries,
    }
}

interface InodeData {
    type: "file" | "directory"
    read: boolean
    write: boolean
    execute: boolean
    size: number
    createdAt: Date
    lastAccessed: Date
    blockPointers: number[]
}

const readInodes = (blockData: string): InodeData[] => {
    const inodeSize = selectSuperblock(store.getState()).inodeSize
    const inodeData = chunk(blockData.split(""), inodeSize).map((d) =>
        d.join(""),
    )

    const result = []

    for (let datum of inodeData) {
        result.push({
            type:
                datum.slice(0, 2) === "00"
                    ? "file"
                    : ("directory" as "file" | "directory"),
            read: datum.slice(2, 4) !== "00",
            write: datum.slice(4, 6) !== "00",
            execute: datum.slice(6, 8) !== "00",
            size: parseInt(datum.slice(8, 32), 2),
            createdAt: new Date(parseInt(datum.slice(32, 64), 2) * 1000),
            lastAccessed: new Date(parseInt(datum.slice(64, 96), 2) * 1000),
            blockPointers: chunk(datum.slice(96, 128).split(""), 4).map(
                (slice) => parseInt(slice.join(""), 2),
            ),
        })
    }

    return result
}

/**
 * Provides a directory listing for the current inode
 * @param inode
 * @returns
 */
export const listing = async (inode: number): Promise<Listing> => {
    const state = store.getState()
    const inodesPerBlock =
        selectBlockSize(state) / selectSuperblock(state).inodeSize
    const offset = selectSuperblock(state).numberOfInodeBlocks + 3
    const blockNumber = Math.floor(inode / inodesPerBlock) + offset
    const blockData = (await readBlock(blockNumber)).data

    return readDirectories(blockData)
}

const readInode = async (inode: number) => {
    const state = store.getState()
    const blockSize = selectBlockSize(state)
    const inodeSize = selectSuperblock(state).inodeSize
    const inodesPerBlock = blockSize / inodeSize
    const inodeBlock = Math.floor(inode / inodesPerBlock) + 3
    const positionInBlock = inode % inodesPerBlock

    const entries = chunk(
        (await readBlock(inodeBlock)).data.split(""),
        inodeSize,
    ).map((entry) => entry.join(""))
    const data = entries[positionInBlock]
    return {
        type:
            data.slice(0, 2) === "00"
                ? "file"
                : ("directory" as "file" | "directory"),
        read: data.slice(2, 4) !== "00",
        write: data.slice(4, 6) !== "00",
        execute: data.slice(6, 8) !== "00",
        size: parseInt(data.slice(8, 32), 2),
        createdAt: new Date(parseInt(data.slice(32, 64), 2) * 1000),
        lastAccessed: new Date(parseInt(data.slice(64, 96), 2) * 1000),
        blockPointers: chunk(data.slice(96, 128).split(""), 4).map((slice) =>
            parseInt(slice.join(""), 2),
        ),
    }
}

const writeInode = async (data: InodeData, inode: number) => {
    const state = store.getState()
    const blockSize = selectBlockSize(state)
    const inodeSize = selectSuperblock(state).inodeSize
    const inodesPerBlock = blockSize / inodeSize
    const inodeBlock = Math.floor(inode / inodesPerBlock) + 3
    const positionInBlock = inode % inodesPerBlock

    const blockData = (await readBlock(inodeBlock)).data
    const firstPiece = blockData.slice(0, positionInBlock * inodeSize)
    const lastPiece = blockData.slice(
        positionInBlock * inodeSize + inodeSize,
        blockSize,
    )
    const type = data.type === "file" ? "00" : "01"
    const read = data.read ? "01" : "00"
    const write = data.write ? "01" : "00"
    const execute = data.execute ? "01" : "00"
    const size = data.size.toString(2).padStart(24, "0")
    const createdAt = Math.floor(data.createdAt.valueOf() / 1000)
        .toString(2)
        .padStart(32, "0")

    const lastAccessed = Math.floor(data.lastAccessed.valueOf() / 1000)
        .toString(2)
        .padStart(32, "0")
    const blockPointers = data.blockPointers
        .map((number) => number.toString(2).padStart(4, "0"))
        .join("")

    const newInode =
        type +
        read +
        write +
        execute +
        size +
        createdAt +
        lastAccessed +
        blockPointers

    await writeBlock(inodeBlock, firstPiece + newInode + lastPiece)
}

const updateBitmap = async (
    which: "data" | "inode",
    position: number,
    filled: boolean,
) => {
    const block = which === "inode" ? 1 : 2
    const bitmap = (await readBlock(block)).data
    const before = bitmap.slice(0, position)
    const after = bitmap.slice(position + 1, bitmap.length)
    const newValue = filled ? "1" : "0"

    const newBitmap = before + newValue + after
    await writeBlock(block, newBitmap)
}

const writeDirectory = async (data: DirectoryData, inode: number) => {
    const pointers = (await readInode(inode)).blockPointers

    for (let pointer of pointers) {
        const blockData = (await readBlock(pointer)).data
        const entries = chunk(blockData.split(""), 128).map((entry) =>
            entry.join(""),
        ) // 128 is the size in bits of a directory entry

        for (let i = 0; i < entries.length; i++) {
            if (!entries[i].includes("1")) {
                // this space is available!
                const first = blockData.slice(0, i * 128)
                const last = blockData.slice(i * 128 + 128, blockData.length)
                const newDirectory = [
                    data.name.split('').map(char => getCharacterEncoding(char).toString(2).padStart(8, "0")).join('').padStart(104, "0"),
                    data.inode.toString(2).padStart(24, "0")
                ].join("")
                await writeBlock(pointer, first + newDirectory + last)
                return
            }
        }
    }

    throw new Error("No space available to write directory entry!")
}

/**
 * A POSIX-style function that opens a file and provides a file descriptor for further
 * changes to this file.
 * @param filename The name of the file you wish to open
 * @param options The flags you wish to specify while opening this file
 * @param permissions The permissions this file should be opened with
 */
export const open = async (
    path: string,
    options: OpenFlags,
    permissions: Permissions,
): Promise<number> => {
    // FIXME - when they specify permissions, is that because those are the permissions we'll create the file with?
    const id = selectFileDescriptorTable(store.getState()).length

    // Require them to always provide the absolute system path. Relative paths will not be supported.
    if (path.length < 1 || path[0] !== "/") {
        throw new InvalidPathError()
    }

    // Get the pieces of the path
    const parsedPath = path.split("/").filter(v => v)
    const filename = parsedPath[parsedPath.length - 1]

    if (filename.length > 13) {
        throw new FilenameTooLongError()
    }

    // read inode 0 from the block to get the root directory
    const inode = await readInode(0)

    if (inode.type !== "directory") {
        throw new Error(
            "The root directory was not located (system corrupted?)",
        )
    }

    const blockPointers = inode.blockPointers.filter((pointer) => pointer !== 0) // remove null pointers

    for (let pointer of blockPointers) {
        const block = await readBlock(pointer)
        const entries = readDirectories(block.data).entries

        const found = entries.find((entry) => entry.name === filename)
        if (found) {
            store.dispatch(addFileDescriptor({ inode: found.inode, path }))
            return id
        }
    }

    if (options === OpenFlags.O_CREAT) {
        // create a new file and move on
        const numberOfInodeBlocks = selectSuperblock(
            store.getState(),
        ).numberOfInodeBlocks

        // find the next free inode from the inode bitmap
        const freeInode = (await readBlock(1)).data // inode bitmap is at block 1
            .split("")
            .findIndex((value) => value === "0") // The first 0 will be a free spot

        await updateBitmap("inode", freeInode, true)

        const freeBlock = (await readBlock(2)).data // data bitmap
            .split("")
            .findIndex((value) => value === "0") // The first 0 will be a free spot

        await updateBitmap("data", freeBlock, true)

        const data: InodeData = {
            type: "file",
            size: 0,
            read: [
                Permissions.Read,
                Permissions.ReadWrite,
                Permissions.ReadWriteExecute,
            ].includes(permissions),
            write: [
                Permissions.Write,
                Permissions.ReadWrite,
                Permissions.ReadWriteExecute,
            ].includes(permissions),
            execute: [
                Permissions.Execute,
                Permissions.ReadExecute,
                Permissions.WriteExecute,
                Permissions.ReadWriteExecute,
            ].includes(permissions),
            createdAt: new Date(),
            lastAccessed: new Date(),
            blockPointers: [
                freeBlock + numberOfInodeBlocks + 3,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            ],
        }

        await writeInode(data, freeInode)

        if(parsedPath.length === 1) {
            // They're trying to write this to the root directory
            await writeDirectory({
                inode: freeInode,
                name: filename
            }, 0)
        } else {
            // try to traverse the path FIXME
        }

        store.dispatch(addFileDescriptor({ inode: freeInode, path }))

        return id
    }

    throw new Error("File not found.")
}

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
 * O_CREAT instructs the handler to create the file if it doesn't exist.
 * O_RDWR instructs the handler to open the file for reading and writing.
 * O_RDONLY instructs the handler to open he file for reading.
 */
export enum OpenFlags {
    /* Something here */
    O_WRONLY,
    O_RDWR,
    O_RDONLY,
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

export interface DirectoryEntry {
    name: string
    inode: number
}

export interface DirectoryInfo {
    entries: DirectoryEntry[]
    data: InodeData
}
export interface DirectoryStructure {
    id: string
    name: string
    path: string
    type: "file" | "directory"
    inode: number
    children?: DirectoryStructure[]
}

/**
 * Takes an inode known to be a directory and provides the entries (from all block pointers)
 * associated with that inode.
 * @param inode The directory inode you wish to read
 * @returns A promise containing an array of directory entries.
 */
export const readDirectory = async (inode: number): Promise<DirectoryInfo> => {
    const inodeData = await readInode(inode)
    const blockPointers = inodeData.blockPointers.filter((v) => v) // remove null pointers
    const entries = []
    for (const pointer of blockPointers) {
        const blockData = (await readBlock(pointer)).data

        // 128 is the size in bits of a directory entry
        const directories = chunk(blockData.split(""), 128).map(
            (directoryData) => directoryData.join(""),
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
    }

    return {
        data: inodeData,
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

/**
 * Provides a directory listing for the current inode
 * @param inode
 * @returns
 */
export const listing = async (
    path: string,
): Promise<DirectoryStructure> => {
        // Require them to always provide the absolute system path. Relative paths will not be supported.
        if (path[0] !== "/") {
            throw new InvalidPathError()
        }
    
        // Get the pieces of the path
        const directories = path.split("/").filter((v) => v)
    
        const rootDirectory = await readDirectory(0)
    
        // CHECK 1: Valid Path
        let directoryInode = 0
        let directory = rootDirectory
        for (let searchDirectory of directories) {
            const entry = directory.entries.find(
                (entry) => entry.name === searchDirectory,
            )
            if (!entry) {
                throw new Error("Invalid path")
            }
            directory = await readDirectory(entry.inode)
            directoryInode = entry.inode
        }

    const directoryName = directories.slice(-1).join("") || "/"

    const result: DirectoryStructure = {
        id: `${directoryInode}-${directoryName}`,
        name: directoryName,
        path: "/" + directories.join("/"),
        type: "directory",
        children: [],
        inode: directoryInode,
    }

    for (let entry of directory.entries) {
        const type = (await readInode(entry.inode)).type
        if (entry.name !== "." && entry.name !== "..") {
            if (type === "directory") {
                const sublist = await listing(result.path + "/" + entry.name)
                result.children!.push(sublist)
            } else {
                result.children!.push({
                    id: `${entry.inode}-${entry.name}`,
                    name: entry.name,
                    path: result.path + "/" + entry.name,
                    type: "file",
                    inode: entry.inode,
                })
            }
        }
    }

    return result
}

export const readInode = async (inode: number): Promise<InodeData> => {
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

/**
 * NOT FOR EXTERNAL USE
 * Writes a new entry into a given directory
 * @param data The directory entry to add
 * @param inode The directory inode to update
 * @returns
 */
const writeDirectory = async (
    data: DirectoryEntry,
    inode: number,
): Promise<void> => {
    const directory = await readDirectory(inode)
    const directoryData = directory.data
    const numberOfInodeBlocks = parseInt(
        (await readBlock(0)).data.slice(24, 28),
        2,
    )

    for (let pointer of directoryData.blockPointers) {
        if (pointer === 0) {
            // we need to allocate a new block for this directory
            const availableDataBlock = (await readBlock(2)).data
                .split("")
                .findIndex((char) => char === "0")

            // write the new block with the entry
            await writeBlock(
                availableDataBlock + numberOfInodeBlocks + 3,
                [
                    data.name
                        .split("")
                        .map((char) =>
                            getCharacterEncoding(char)
                                .toString(2)
                                .padStart(8, "0"),
                        )
                        .join("")
                        .padStart(104, "0"),
                    data.inode.toString(2).padStart(24, "0"),
                ].join(""),
            )

            const newBlockPointers = [
                ...directoryData.blockPointers,
                availableDataBlock + 3 + numberOfInodeBlocks,
            ].filter((v) => v)

            while (newBlockPointers.length < 8) {
                newBlockPointers.push(0)
            }

            // update the directory to have the new information
            await writeInode(
                {
                    type: "directory",
                    size: directoryData.size + 128,
                    createdAt: directoryData.createdAt,
                    lastAccessed: new Date(),
                    execute: directoryData.execute,
                    read: directoryData.read,
                    write: directoryData.write,
                    blockPointers: newBlockPointers,
                },
                inode,
            )

            // update the data bitmap
            await updateBitmap("data", availableDataBlock, true)
            return
        }

        const rawDirectory = (await readBlock(pointer)).data
        const entries = chunk(rawDirectory.split(""), 128).map((entry) =>
            entry.join(""),
        )
        for (let i = 0; i < entries.length; i++) {
            if (entries[i] === "0".repeat(128)) {
                // Free spot for a new directory entry
                const freePosition = i * 128
                const first = rawDirectory.slice(0, freePosition)
                const last = rawDirectory.slice(freePosition + 128)
                const newData = [
                    data.name
                        .split("")
                        .map((char) =>
                            getCharacterEncoding(char)
                                .toString(2)
                                .padStart(8, "0"),
                        )
                        .join("")
                        .padStart(104, "0"),
                    data.inode.toString(2).padStart(24, "0"),
                ].join("")

                await writeBlock(pointer, first + newData + last)
                return
            }
        }
    }

    throw new Error("Unable to write directory")
}

const canAccess = (inodeData: InodeData, flags: OpenFlags[]): boolean => {
    const { read, write } = inodeData
    if (flags.includes(OpenFlags.O_RDONLY) && !read) {
        return false
    } else if (flags.includes(OpenFlags.O_WRONLY) && !write) {
        return false
    } else if (flags.includes(OpenFlags.O_RDWR) && !(read && write)) {
        return false
    } else {
        return true
    }
}

/**
 * A POSIX-style function that opens a file and provides a file descriptor for further
 * changes to this file.
 * @param filename The name of the file you wish to open
 * @param flags The flags you wish to specify while opening this file
 * @param mode The permissions this file should be created with if O_CREAT is specified. If not, this field is ignored
 */
export const open = async (
    path: string,
    flags: OpenFlags[],
    mode: Permissions,
): Promise<number> => {
    const count = flags.reduce(
        (accumulator, flag) =>
            [OpenFlags.O_RDONLY, OpenFlags.O_WRONLY, OpenFlags.O_RDWR].includes(
                flag,
            )
                ? accumulator + 1
                : accumulator,
        0,
    )
    if (count !== 1) {
        throw new Error(
            "You must provide exactly one of: O_RDONLY, O_RDWR, or O_WRONLY when opening a file.",
        )
    }

    const id = selectFileDescriptorTable(store.getState()).length

    // Require them to always provide the absolute system path. Relative paths will not be supported.
    if (!(path.length > 1 && path[0] === "/")) {
        throw new InvalidPathError()
    }

    // Get the pieces of the path
    const parsedPath = path.split("/").filter((v) => v)
    const directories = parsedPath.slice(0, -1) // the directories will be everything but the last item
    const filename = parsedPath.slice(-1).join("") // the last value should be the filename

    if (filename.length === 0) {
        throw new Error("Invalid filename.")
    }

    if (filename.length > 13) {
        throw new FilenameTooLongError()
    }

    const rootDirectory = await readDirectory(0)

    // CHECK 1: Valid Path
    let directoryInode = 0
    let directory = rootDirectory
    for (let searchDirectory of directories) {
        const entry = directory.entries.find(
            (entry) => entry.name === searchDirectory,
        )
        if (!entry) {
            throw new Error("Invalid path")
        }
        directory = await readDirectory(entry.inode)
        directoryInode = entry.inode
    }

    for (const entry of directory.entries) {
        if (entry.name === filename) {
            // find the file and check its permissions
            const fileInode = await readInode(entry.inode)
            if (canAccess(fileInode, flags)) {
                store.dispatch(
                    addFileDescriptor({ inode: entry.inode, path, flags }),
                )
                return id
            } else {
                throw new Error(`'${entry.name}': Permission denied.`)
            }
        }
    }

    if (flags.includes(OpenFlags.O_CREAT)) {
        // try to create a new file

        /*
        NECESSARY CHECKS BEFORE CREATING A FILE:

        1. Is the path provided valid? (only absolute paths will be supported)
        2. Is there enough space on the disk for another inode?
        3. Is there enough space on the disk for another file?
        4. Is there enough space on disk for another directory entry?
       */

        // It was a valid path, check if the filename is already in that directory
        if (directory.entries.find((entry) => entry.name === filename)) {
            throw new Error("That file alread exists.")
        }

        // It was a valid path and the file didn't exist.
        // CHECK 2: Enough space on disk for another inode
        const superblock = (await readBlock(0)).data // block 0 contains the superblock
        const numberOfInodes = parseInt(superblock.slice(8, 24), 2) // number of inodes
        const numberOfInodeBlocks = parseInt(superblock.slice(24, 28), 2) // number of inode blocks
        const numberOfDataBlocks = parseInt(superblock.slice(28, 32), 2) // number of data blocks
        const inodeBitmap = (await readBlock(1)).data // block 1 contains the inode bitmap
        const availableInode = inodeBitmap
            .split("")
            .findIndex((char) => char === "0") // 0 means it's free
        if (availableInode === -1 || availableInode >= numberOfInodes) {
            // there's no space to allocate a new inode
            throw new Error("No available inodes for new file.")
        }

        // CHECK 3: Enough space on disk for another file?
        const dataBitmap = (await readBlock(2)).data // block 2 contains the data bitmap
        const availableDataBlock = dataBitmap
            .split("")
            .findIndex((char) => char === "0") // 0 means it's free
        if (
            availableDataBlock === -1 ||
            availableDataBlock >= numberOfDataBlocks
        ) {
            // there's no space to allocate a new data block
            throw new Error("No available data blocks for new file.")
        }

        // CHECK 4: Enough space on disk for another directory entry?
        let availableSpace = false
        for (const pointer of directory.data.blockPointers) {
            if (pointer === 0) {
                // this is a null pointer. It means we need to try and allocate a new block for this directory.
                // We already needed to add another block for the file. We can't use the same bitmap spot
                const newDirectoryBlock = dataBitmap
                    .split("")
                    .findIndex(
                        (char, index) =>
                            char === "0" && index !== availableDataBlock,
                    )
                if (
                    newDirectoryBlock === -1 ||
                    newDirectoryBlock >= numberOfDataBlocks
                ) {
                    throw new Error(
                        "No available data blocks for new directory entry.",
                    )
                }
                availableSpace = true
                break
            } else {
                const directoryBlock = (await readBlock(pointer)).data
                if (directoryBlock.includes("0".repeat(128))) {
                    // the directory block contains a free spot for a new directory entry
                    availableSpace = true
                    break
                }
            }
        }

        if (!availableSpace) {
            throw new Error("Maximum directory size exceeded.")
        }

        // Write the new Inode pointing to this file
        writeInode(
            {
                type: "file",
                size: 0,
                createdAt: new Date(),
                lastAccessed: new Date(),
                read: [
                    Permissions.Read,
                    Permissions.ReadWrite,
                    Permissions.ReadWriteExecute,
                ].includes(mode),
                write: [
                    Permissions.Write,
                    Permissions.ReadWrite,
                    Permissions.ReadWriteExecute,
                ].includes(mode),
                execute: [
                    Permissions.Execute,
                    Permissions.ReadExecute,
                    Permissions.WriteExecute,
                    Permissions.ReadWriteExecute,
                ].includes(mode),
                blockPointers: [availableDataBlock + 3 + numberOfInodeBlocks],
            },
            availableInode,
        )

        // Update the directory entry
        await writeDirectory(
            {
                inode: availableInode,
                name: filename,
            },
            directoryInode,
        )

        // Update the two bitmaps
        await updateBitmap("inode", availableInode, true)
        await updateBitmap("data", availableDataBlock, true)

        // The file should have been written!
        store.dispatch(
            addFileDescriptor({ inode: availableInode, path, flags }),
        )
    }

    return id
}

const getBasicDirectoryData = (parentInode: number, inode: number) => {
    return [
        // . directory
        "00000000".repeat(12), // 12 null characters
        getCharacterEncoding(".").toString(2).padStart(8, "0"), // get . as ASCII
        inode.toString(2).padStart(24, "0"),

        // .. directory
        "00000000".repeat(11), // 11 null characters
        getCharacterEncoding(".").toString(2).padStart(8, "0").repeat(2), // .. as ASCII
        parentInode.toString(2).padStart(24, "0"), // inode number
    ].join("")
}

export const mkdir = async (path: string, mode: Permissions): Promise<void> => {
    // Require them to always provide the absolute system path. Relative paths will not be supported.
    if (!(path.length > 1 && path[0] === "/")) {
        throw new InvalidPathError()
    }

    // Get the pieces of the path
    const parsedPath = path.split("/").filter((v) => v)
    const directories = parsedPath.slice(0, -1) // the directories will be everything but the last item
    const folderName = parsedPath.slice(-1).join("") // the last value should be the filename

    if (folderName.length === 0) {
        throw new Error("Invalid directory name.")
    }

    if (folderName.length > 13) {
        throw new FilenameTooLongError()
    }

    const rootDirectory = await readDirectory(0)

    // try to create a new file

    /*
        NECESSARY CHECKS BEFORE CREATING A FILE:

        1. Is the path provided valid? (only absolute paths will be supported)
        2. Is there enough space on the disk for another inode?
        3. Is there enough space on the disk for another file?
        4. Is there enough space on disk for another directory entry?
       */

    // CHECK 1: Valid Path
    let directoryInode = 0
    let directory = rootDirectory
    for (let searchDirectory of directories) {
        const entry = directory.entries.find(
            (entry) => entry.name === searchDirectory,
        )
        if (!entry) {
            throw new Error("Invalid path")
        }
        directory = await readDirectory(entry.inode)
        directoryInode = entry.inode
    }

    // It was a valid path, check if the folder name is already in that directory
    if (directory.entries.find((entry) => entry.name === folderName)) {
        throw new Error("That directory alread exists.")
    }

    // It was a valid path and the file didn't exist.
    // CHECK 2: Enough space on disk for another inode
    const superblock = (await readBlock(0)).data // block 0 contains the superblock
    const numberOfInodes = parseInt(superblock.slice(8, 24), 2) // number of inodes
    const numberOfInodeBlocks = parseInt(superblock.slice(24, 28), 2) // number of inode blocks
    const numberOfDataBlocks = parseInt(superblock.slice(28, 32), 2) // number of data blocks
    const inodeBitmap = (await readBlock(1)).data // block 1 contains the inode bitmap
    const availableInode = inodeBitmap
        .split("")
        .findIndex((char) => char === "0") // 0 means it's free
    if (availableInode === -1 || availableInode >= numberOfInodes) {
        // there's no space to allocate a new inode
        throw new Error("No available inodes for new file.")
    }

    // CHECK 3: Enough space on disk for another file?
    const dataBitmap = (await readBlock(2)).data // block 2 contains the data bitmap
    const availableDataBlock = dataBitmap
        .split("")
        .findIndex((char) => char === "0") // 0 means it's free
    if (availableDataBlock === -1 || availableDataBlock >= numberOfDataBlocks) {
        // there's no space to allocate a new data block
        throw new Error("No available data blocks for new file.")
    }

    // CHECK 4: Enough space on disk for another directory entry?
    let availableSpace = false
    for (const pointer of directory.data.blockPointers) {
        if (pointer === 0) {
            // this is a null pointer. It means we need to try and allocate a new block for this directory.
            // We already needed to add another block for the file. We can't use the same bitmap spot
            const newDirectoryBlock = dataBitmap
                .split("")
                .findIndex(
                    (char, index) =>
                        char === "0" && index !== availableDataBlock,
                )
            if (
                newDirectoryBlock === -1 ||
                newDirectoryBlock >= numberOfDataBlocks
            ) {
                throw new Error(
                    "No available data blocks for new directory entry.",
                )
            }
            availableSpace = true
            break
        } else {
            const directoryBlock = (await readBlock(pointer)).data
            if (directoryBlock.includes("0".repeat(128))) {
                // the directory block contains a free spot for a new directory entry
                availableSpace = true
                break
            }
        }
    }

    if (!availableSpace) {
        throw new Error("Maximum directory size exceeded.")
    }

    // Write the new Inode pointing to this file
    writeInode(
        {
            type: "directory",
            size: 0,
            createdAt: new Date(),
            lastAccessed: new Date(),
            read: [
                Permissions.Read,
                Permissions.ReadWrite,
                Permissions.ReadWriteExecute,
            ].includes(mode),
            write: [
                Permissions.Write,
                Permissions.ReadWrite,
                Permissions.ReadWriteExecute,
            ].includes(mode),
            execute: [
                Permissions.Execute,
                Permissions.ReadExecute,
                Permissions.WriteExecute,
                Permissions.ReadWriteExecute,
            ].includes(mode),
            blockPointers: [availableDataBlock + 3 + numberOfInodeBlocks],
        },
        availableInode,
    )

    // write the basic directories
    await writeBlock(availableDataBlock + 3 + numberOfInodeBlocks, getBasicDirectoryData(directoryInode, availableInode))

    // Update the directory entry
    await writeDirectory(
        {
            inode: availableInode,
            name: folderName,
        },
        directoryInode,
    )

    // Update the two bitmaps
    await updateBitmap("inode", availableInode, true)
    await updateBitmap("data", availableDataBlock, true)

    // The folder should have been written!
}

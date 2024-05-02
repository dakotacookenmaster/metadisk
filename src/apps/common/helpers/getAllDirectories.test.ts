import { describe, test, expect, vi } from "vitest"
import InodeData from "../../../apis/interfaces/vsfs/InodeData.interface"
import Permissions from "../../../apis/enums/vsfs/Permissions.enum"
import * as readBlock from "../../../apis/vsfs/system/ReadBlock.vsfs"
import ReadBlockPayload from "../../../apis/interfaces/vsfs/ReadBlockPayload.interface"

const inodeBlocks: InodeData[][] = [
    [
        {
            type: "file",
            inode: 1,
            createdAt: new Date("11/17/1998"),
            lastModified: new Date("11/17/1998"),
            permissions: Permissions.READ_WRITE_EXECUTE,
            size: 0,
            blockPointers: [0],
        },
        {
            type: "directory",
            inode: 0,
            createdAt: new Date("11/15/1998"),
            lastModified: new Date("11/15/1998"),
            permissions: Permissions.READ_WRITE,
            size: 8,
            blockPointers: [0],
        },
    ],
    [
        {
            type: "file",
            inode: 1,
            createdAt: new Date("11/17/1998"),
            lastModified: new Date("11/17/1998"),
            permissions: Permissions.READ_WRITE_EXECUTE,
            size: 0,
            blockPointers: [0],
        },
        {
            type: "directory",
            inode: 0,
            createdAt: new Date("11/15/1998"),
            lastModified: new Date("11/15/1998"),
            permissions: Permissions.READ_WRITE,
            size: 8,
            blockPointers: [0],
        },
    ],
]

vi.mock("../../../apis/vsfs/system/ReadBlock.vsfs", () => {
    const readBlock = (block: number) => {
        if (block === 1) {
            return {
                data: {
                    raw: "1111",
                },
            }
        } else if (block === 3) {
        } else if (block === 4) {
        }
    }

    return {
        readBlock,
    }
})

const readBlockSpy = vi.spyOn(readBlock, "readBlock")
const inodeBlockNumbers = [3, 4]

describe("it returns all of the block numbers that store directory entries", () => {})

import { describe, test, expect, vi } from "vitest"
import InodeData from "../../../apis/interfaces/vsfs/InodeData.interface"
import Permissions from "../../../apis/enums/vsfs/Permissions.enum"
import * as readBlock from "../../../apis/vsfs/system/ReadBlock.vsfs"

vi.mock("../../../apis/vsfs/system/ReadBlock.vsfs", () => {
    const readBlock = (block: number) => {
        if(block === 0) {

        }
    }

    return {
        readBlock
    }
})

const readBlockSpy = vi.spyOn(readBlock, "readBlock")

const inodes: InodeData[] = [
    {
        type: "file",
        inode: 1,
        createdAt: new Date("11/17/1998"),
        lastModified: new Date("11/17/1998"),
        permissions: Permissions.READ_WRITE_EXECUTE,
        size: 8,
        blockPointers: [1] 
    },
    {
        type: "directory",
        inode: 0,
        createdAt: new Date("11/15/1998"),
        lastModified: new Date("11/15/1998"),
        permissions: Permissions.READ_WRITE,
        size: 8,
        blockPointers: [0] 
    }
]

describe("it returns all of the block numbers that store directory entries", () => {

})


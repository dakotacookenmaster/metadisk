import { describe, test, expect, vi } from "vitest"
import getLabel from "./getLabel"

vi.mock("../../../store", () => {
    const store = {
        getState: () => ({
            fileSystem: {
                superblock: {
                    numberOfInodeBlocks: 2,
                    inodeStartIndex: 3,
                }
            }
        })
    }

    return {
        store
    }
})

describe("it should return the appropriate block label, based on the number", () => {
    test("get the superblock", () => {
        expect(getLabel(0)).toBe("Superblock")
    })
    test("get the inode bitmap", () => {
        expect(getLabel(1)).toBe("Inode Bitmap")
    })
    test("get the data bitmap", () => {
        expect(getLabel(2)).toBe("Data Bitmap")
    })
    test("get the two inode blocks", () => {
        expect(getLabel(3)).toBe("Inode Block 0")
        expect(getLabel(4)).toBe("Inode Block 1")
    })
    test("the data blocks should be last", () => {
        expect(getLabel(5)).toBe("Data Block 0")
        expect(getLabel(6)).toBe("Data Block 1")
        expect(getLabel(7)).toBe("Data Block 2")
    })
})
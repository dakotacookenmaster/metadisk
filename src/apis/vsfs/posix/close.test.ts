import { expect, describe, beforeEach, beforeAll, test } from "vitest"
import initializeSuperblock from "../system/InitializeSuperblock.vsfs"
import { store } from "../../../store"
import { setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import open from "./open.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"
import { selectFileDescriptorTable } from "../../../redux/reducers/fileSystemSlice"
import close from "./close.vsfs"
import { InvalidFileDescriptorError } from "../../api-errors/InvalidFileDescriptor.error"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("closes an open file", () => {
    test("successfully closes an opened file", async () => {
        const fd = await open(
            "/abc",
            [OpenFlags.O_CREAT, OpenFlags.O_RDWR],
            Permissions.READ_WRITE_EXECUTE,
        )
        let fdTable = selectFileDescriptorTable(store.getState())
        expect(fdTable[fd]).not.toBeUndefined()

        close(fd)

        fdTable = selectFileDescriptorTable(store.getState())

        expect(fdTable[fd]).toBeNull()
    })
    test("fails when an invalid file descriptor is provided", async () => {
        expect(() => close(-1)).toThrowError(InvalidFileDescriptorError)
        expect(() => close(1000000)).toThrowError(InvalidFileDescriptorError)
    })
})

import { beforeAll, expect, test } from "vitest"
import listing from "../vsfs/posix/listing.vsfs"
import DirectoryListing from "../interfaces/vsfs/DirectoryListing.interface"
import initializeSuperblock from "../vsfs/system/InitializeSuperblock.vsfs"
import { setSkipWaitTime } from "../../redux/reducers/diskSlice"
import { store } from "../../store"

beforeAll(async () => {
    store.dispatch(setSkipWaitTime(true))
    await initializeSuperblock(() => {})
})

test("the / directory should return the . and .. directories when empty", () => {
    expect(listing("/")).resolves.toStrictEqual({
        pathname: "/",
        inode: 0,
        entries: [
            {
                inode: 0,
                name: "\uE400".repeat(12) + "."
            },
            {
                inode: 0,
                name: "\uE400".repeat(11) + ".."
            }
        ]
    } satisfies DirectoryListing)
})
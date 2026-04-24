import { describe, expect, test, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import React from "react"
import AppContext from "../AppContext"
import Permissions from "../../../apis/enums/vsfs/Permissions.enum"

// Mock every underlying POSIX/block module BEFORE importing the hook so
// the hook picks up our spies as the imported defaults.
vi.mock("../../../apis/vsfs/posix/open.vsfs", () => ({
    default: vi.fn().mockResolvedValue(0),
}))
vi.mock("../../../apis/vsfs/posix/close.vsfs", () => ({
    default: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("../../../apis/vsfs/posix/read.vsfs", () => ({
    default: vi.fn().mockResolvedValue(""),
}))
vi.mock("../../../apis/vsfs/posix/write.vsfs", () => ({
    default: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("../../../apis/vsfs/posix/listing.vsfs", () => ({
    default: vi.fn().mockResolvedValue({ entries: [] }),
}))
vi.mock("../../../apis/vsfs/posix/mkdir.vsfs", () => ({
    default: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("../../../apis/vsfs/posix/rmdir.vsfs", () => ({
    default: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("../../../apis/vsfs/posix/unlink.vsfs", () => ({
    default: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("../../../apis/vsfs/system/BlockCache.vsfs", () => ({
    readBlock: vi.fn().mockResolvedValue({ data: { raw: new Uint8Array(0) } }),
    writeBlock: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("../../../apis/vsfs/system/ReadBlocks.vsfs", () => ({
    readBlocks: vi.fn().mockResolvedValue([]),
}))
vi.mock("../../../apis/vsfs/system/WriteBlocks.vsfs", () => ({
    writeBlocks: vi.fn().mockResolvedValue([]),
}))

import _open from "../../../apis/vsfs/posix/open.vsfs"
import _close from "../../../apis/vsfs/posix/close.vsfs"
import _read from "../../../apis/vsfs/posix/read.vsfs"
import _write from "../../../apis/vsfs/posix/write.vsfs"
import _listing from "../../../apis/vsfs/posix/listing.vsfs"
import _mkdir from "../../../apis/vsfs/posix/mkdir.vsfs"
import _rmdir from "../../../apis/vsfs/posix/rmdir.vsfs"
import _unlink from "../../../apis/vsfs/posix/unlink.vsfs"
import {
    readBlock as _readBlock,
    writeBlock as _writeBlock,
} from "../../../apis/vsfs/system/BlockCache.vsfs"
import { readBlocks as _readBlocks } from "../../../apis/vsfs/system/ReadBlocks.vsfs"
import { writeBlocks as _writeBlocks } from "../../../apis/vsfs/system/WriteBlocks.vsfs"
import usePosix from "./usePosix"

const wrap =
    (appId: string | null) =>
    ({ children }: { children: React.ReactNode }) =>
        React.createElement(AppContext.Provider, { value: appId }, children)

beforeEach(() => {
    vi.clearAllMocks()
})

describe("usePosix() injects the AppContext appId into every call", () => {
    test("forwards appId from context to every POSIX/block function", async () => {
        const { result } = renderHook(() => usePosix(), {
            wrapper: wrap("editor"),
        })

        await result.current.open("/a", [], Permissions.READ)
        await result.current.close(1)
        await result.current.read(1)
        await result.current.write(1, new Uint8Array(0))
        await result.current.listing("/")
        await result.current.mkdir("/d")
        await result.current.rmdir("/d")
        await result.current.unlink("/a")
        await result.current.readBlock(0)
        await result.current.writeBlock(0, new Uint8Array(0))
        await result.current.readBlocks([0])
        await result.current.writeBlocks([0], [new Uint8Array(0)])

        expect(_open).toHaveBeenCalledWith("/a", [], Permissions.READ, "editor")
        expect(_close).toHaveBeenCalledWith(1, "editor")
        expect(_read).toHaveBeenCalledWith(1, "editor")
        expect(_write).toHaveBeenCalledWith(1, new Uint8Array(0), "editor")
        expect(_listing).toHaveBeenCalledWith("/", "editor")
        expect(_mkdir).toHaveBeenCalledWith("/d", "editor")
        expect(_rmdir).toHaveBeenCalledWith("/d", "editor")
        expect(_unlink).toHaveBeenCalledWith("/a", "editor")
        expect(_readBlock).toHaveBeenCalledWith(0, undefined, "editor")
        expect(_writeBlock).toHaveBeenCalledWith(
            0,
            new Uint8Array(0),
            undefined,
            "editor",
        )
        expect(_readBlocks).toHaveBeenCalledWith([0], undefined, "editor")
        expect(_writeBlocks).toHaveBeenCalledWith(
            [0],
            [new Uint8Array(0)],
            undefined,
            "editor",
        )
    })

    test("with no provider, appId is undefined and is forwarded as such (system caller)", async () => {
        const { result } = renderHook(() => usePosix())
        expect(result.current.appId).toBeUndefined()
        await result.current.open("/a", [], Permissions.READ)
        expect(_open).toHaveBeenCalledWith("/a", [], Permissions.READ, undefined)
    })

    test("the returned function bag is referentially stable per appId", () => {
        const { result, rerender } = renderHook(() => usePosix(), {
            wrapper: wrap("editor"),
        })
        const first = result.current
        rerender()
        expect(result.current).toBe(first)
    })

    test("different provider values produce different bound appIds", async () => {
        const a = renderHook(() => usePosix(), { wrapper: wrap("editor") })
        await a.result.current.open("/a", [], Permissions.READ)
        expect(_open).toHaveBeenLastCalledWith("/a", [], Permissions.READ, "editor")

        const b = renderHook(() => usePosix(), {
            wrapper: wrap("file-explorer"),
        })
        await b.result.current.open("/a", [], Permissions.READ)
        expect(_open).toHaveBeenLastCalledWith("/a", [], Permissions.READ, "file-explorer")
    })
})

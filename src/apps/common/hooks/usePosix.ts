import { useContext, useMemo } from "react"
import AppContext from "../AppContext"
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

/**
 * Returns POSIX (and low-level block) functions with the **current app's id
 * pre-bound** as the trailing `appId` argument.
 *
 * --------------------------------------------------------------------------
 * WHY THIS EXISTS (and why apps must use it instead of importing the POSIX
 * functions directly):
 * --------------------------------------------------------------------------
 *
 * The disk simulator needs to display, for every entry currently in the
 * disk queue, an icon of the app that initiated the request. To do that
 * without forcing every call site to manually pass `"file-explorer"` /
 * `"editor"` / etc. on every single POSIX call, attribution is propagated
 * automatically via React context:
 *
 *   1. `MainWindow` wraps each enabled app in
 *      `<AppContext.Provider value={app.id}>`.
 *   2. Components inside that subtree call `usePosix()` instead of
 *      `import open from ".../open.vsfs"`.
 *   3. This hook reads `AppContext` and returns POSIX functions with that
 *      id curried in as the trailing `appId` parameter.
 *   4. The POSIX layer threads `appId` down through `BlockCache` → block
 *      ops → `readSector`/`writeSector`, which stamp it onto the queued
 *      payload.
 *   5. The disk simulator groups consecutive queue entries by
 *      `(blockNumber, appId, type)` and renders the matching app icon
 *      under each group.
 *
 * Why **not** just import the POSIX functions directly and let `appId`
 * default to `undefined`?
 *
 *   - The whole feature breaks: every queued sector would be unattributed
 *     and rendered under the generic "system" indicator.
 *   - Apps would have to remember to pass `appId` manually on every call.
 *     That is exactly the boilerplate this hook is designed to eliminate.
 *   - Other approaches (a module-level "current app" variable updated by
 *     `runAs(appId, fn)`, or stack-trace sniffing) either race when
 *     multiple apps' async POSIX calls interleave (which is the normal
 *     case in Metadisk) or break under production builds.
 *
 * Stack of safety properties guaranteed by going through the hook:
 *   - The right `appId` always reaches the disk because it is tied to the
 *     React tree position, which doesn't change under async interleaving.
 *   - TypeScript prevents app code from importing the underlying POSIX
 *     functions accidentally, as long as code review enforces "use
 *     `usePosix()` from inside an app subtree."
 *   - System-internal callers (e.g. cache eviction, superblock setup) that
 *     don't have a React context can keep calling the underlying functions
 *     directly; their requests show up as "system" in the simulator.
 *
 * If you find yourself importing `open`/`read`/`write`/etc. directly into
 * an app component, STOP — use this hook instead. The exception is tests
 * that exercise the POSIX functions in isolation: those legitimately need
 * direct imports.
 */
export default function usePosix() {
    const appId = useContext(AppContext) ?? undefined

    // Memoize so identical references are returned across renders when the
    // appId hasn't changed. Components can then safely include returned
    // functions in `useEffect` dependency arrays without triggering loops.
    return useMemo(() => {
        return {
            // POSIX file/directory operations
            open: ((pathname, flags, mode) =>
                _open(pathname, flags, mode, appId)) as typeof _open,
            close: ((fd) => _close(fd, appId)) as typeof _close,
            read: ((fd) => _read(fd, appId)) as typeof _read,
            write: ((fd, data) => _write(fd, data, appId)) as typeof _write,
            listing: ((pathname) =>
                _listing(pathname, appId)) as typeof _listing,
            mkdir: ((pathname) => _mkdir(pathname, appId)) as typeof _mkdir,
            rmdir: ((pathname) => _rmdir(pathname, appId)) as typeof _rmdir,
            unlink: ((pathname) => _unlink(pathname, appId)) as typeof _unlink,

            // Lower-level block operations (used by the VSFS visualizer to
            // inspect raw block contents without going through POSIX).
            readBlock: ((block, progressCb) =>
                _readBlock(block, progressCb, appId)) as typeof _readBlock,
            writeBlock: ((block, data, progressCb) =>
                _writeBlock(
                    block,
                    data,
                    progressCb,
                    appId,
                )) as typeof _writeBlock,
            readBlocks: ((blocks, progressCb) =>
                _readBlocks(blocks, progressCb, appId)) as typeof _readBlocks,
            writeBlocks: ((blocks, data, progressCb) =>
                _writeBlocks(
                    blocks,
                    data,
                    progressCb,
                    appId,
                )) as typeof _writeBlocks,

            /**
             * The id of the app this hook is bound to (`undefined` outside
             * of any `AppContext.Provider`). Exposed so tests and the queue
             * grouping logic can inspect attribution.
             */
            appId,
        }
    }, [appId])
}

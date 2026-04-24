export default interface DiskReadPayload {
    type: "read"
    requestId: string
    sectorNumber: number
    /**
     * Identifier of the registered app that originated this disk request.
     * Set automatically by the `usePosix()` hook from the current
     * `AppContext`. May be `undefined` for system-internal calls (e.g.
     * cache eviction, superblock initialization) — the disk simulator
     * groups those under a generic "system" indicator.
     */
    appId?: string
    /**
     * Identifier of the higher-level *operation* (typically a single
     * `readBlock` / `writeBlock` call) that this sector request belongs
     * to. All sector payloads produced by one block op share the same
     * `opId`. The disk simulator groups queued entries by `opId` so that
     * one bracket on screen always corresponds to exactly one logical
     * operation, even as items dequeue and shift the queue around.
     *
     * `undefined` means "this sector was issued in isolation" (e.g. a
     * direct call to `readSector`/`writeSector`); the simulator gives
     * such entries their own single-item group.
     */
    opId?: string
}
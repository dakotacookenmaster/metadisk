export default interface DiskWritePayload {
    type: "write"
    sectorNumber: number
    requestId: string
    data: Uint8Array
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
     * to. See `DiskReadPayload.opId` for full rationale.
     */
    opId?: string
}
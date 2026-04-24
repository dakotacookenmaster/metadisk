export default interface CurrentlyServicingPayload {
    requestId: string
    type: "read" | "write"
    sectorNumber: number
    data?: Uint8Array
    /** Carried through from the originating queue payload (see `DiskReadPayload.appId`). */
    appId?: string
    /** Carried through from the originating queue payload (see `DiskReadPayload.opId`). */
    opId?: string
}
export default interface CurrentlyServicingPayload<T extends "read" | "write"> {
    requestId: string
    type: T extends "read" ? "read" : "write"
    sectorNumber: number
    data: T extends "read" ? Uint8Array : undefined
}
export default interface DiskWritePayload {
    type: "write"
    sectorNumber: number
    requestId: string
    data: string
}
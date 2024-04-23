export default interface DiskReadPayload {
    type: "read"
    requestId: string
    sectorNumber: number
}
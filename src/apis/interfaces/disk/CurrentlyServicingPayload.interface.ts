export default interface CurrentlyServicingPayload {
    requestId: string
    type: "read" | "write"
    sectorNumber: number
    data?: string
}
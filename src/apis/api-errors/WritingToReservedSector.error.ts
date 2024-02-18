export class WritingToReservedSectorError extends Error {
    constructor(msg?: string) {
        super(`You are attempting to write to a reserved sector. ${msg ?? ""}`)
    }
}
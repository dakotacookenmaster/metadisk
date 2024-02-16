export class SectorOverflowError extends Error {
    constructor(msg?: string) {
        super(`The data you provided is too large to be written to a single sector. Break this data into multiple writes. ${msg ?? ""}`)
    }
}
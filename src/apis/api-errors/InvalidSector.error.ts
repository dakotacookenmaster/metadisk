export class InvalidSectorError extends Error {
    constructor(msg?: string) {
        super(`The sector you specified does not exist. ${msg ?? ""}`)
    }
}
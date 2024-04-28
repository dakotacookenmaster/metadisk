export class FileOverflowError extends Error {
    constructor(msg?: string) {
        super(`The file you are attempting to write is too large. ${msg ?? ""}`)
    }
}
export class BadDataLengthError extends Error {
    constructor(msg?: string) {
        super(`The length of the data did not match the length of the requested blocks. ${msg ?? ""}`)
    }
}
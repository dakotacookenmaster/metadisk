export class InvalidBinaryStringError extends Error {
    constructor(msg?: string) {
        super(`The string you provided has invalid binary characters. ${msg ?? ""}`)
    }
}
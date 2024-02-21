export class InvalidBlockAddressError extends Error {
    constructor(msg?: string) {
        super(`You provided an invalid block address. ${msg ?? ""}`)
    }
}
export class OpenDirectoryError extends Error {
    constructor(msg?: string) {
        super(`The 'open' method cannot open a directory. ${msg ?? ""}`)
    }
}
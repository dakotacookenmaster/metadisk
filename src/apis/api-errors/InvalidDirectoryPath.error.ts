export class InvalidDirectoryPath extends Error {
    constructor(msg?: string) {
        super(`The path you provided was not to a directory. ${msg ?? ""}`)
    }
}
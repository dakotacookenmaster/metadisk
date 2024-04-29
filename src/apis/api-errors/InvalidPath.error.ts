export class InvalidPathError extends Error {
    constructor(msg?: string) {
        super(`The path you provided was invalid. Did you provide an absolute path? ${msg ?? ""}`)
    }
}
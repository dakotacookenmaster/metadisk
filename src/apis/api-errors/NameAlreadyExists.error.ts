export class NameAlreadyExistsError extends Error {
    constructor(msg?: string) {
        super(`That name is already being used in this directory. ${msg ?? ""}`)
    }
}
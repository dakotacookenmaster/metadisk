export class NameAlreadyExistsError extends Error {
    constructor(msg?: string) {
        super(`That name is already being used. ${msg ?? ""}`)
    }
}
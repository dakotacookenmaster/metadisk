export class BlockUnderflowError extends Error {
    constructor(msg?: string) {
        super(`The data you provided is too small to be written to a block. ${msg ?? ""}`)
    }
}
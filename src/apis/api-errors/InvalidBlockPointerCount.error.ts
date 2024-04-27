export class InvalidBlockPointerCountError extends Error {
    constructor(msg?: string) {
        super(`An inode is required to have 8 block pointers. ${msg ?? ""}`)
    }
}
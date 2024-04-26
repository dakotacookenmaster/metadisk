export class DirectoryOverflowError extends Error {
    constructor(msg?: string) {
        super(`This directory cannot store any more entries. ${msg ?? ""}`)
    }
}
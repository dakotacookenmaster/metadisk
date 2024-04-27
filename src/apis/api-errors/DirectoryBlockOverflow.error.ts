export class DirectoryBlockOverflowError extends Error {
    constructor(msg?: string) {
        super(`This directory block cannot store that many entries. ${msg ?? ""}`)
    }
}
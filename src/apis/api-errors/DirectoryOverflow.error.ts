/* c8 ignore start */
export class DirectoryOverflowError extends Error {
    constructor(msg?: string) {
        super(`This directory cannot store any more entries. ${msg ?? ""}`)
    }
}
/* c8 ignore stop */
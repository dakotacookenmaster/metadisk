/* c8 ignore start */
export class DataBlockOverflowError extends Error {
    constructor(msg?: string) {
        super(`There are no available data blocks to create this new file or directory. ${msg ?? ""}`)
    }
}
/* c8 ignore stop */
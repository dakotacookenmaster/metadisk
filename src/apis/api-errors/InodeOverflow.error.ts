export class InodeOverflowError extends Error {
    constructor(msg?: string) {
        super(`There are no available inodes to create this new file or directory. ${msg ?? ""}`)
    }
}
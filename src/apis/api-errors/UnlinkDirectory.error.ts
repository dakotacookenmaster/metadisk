export class UnlinkDirectoryError extends Error {
    constructor(msg?: string) {
        super(`The 'unlink' method cannot remove a directory. Try 'rmdir' instead. ${msg ?? ""}`)
    }
}
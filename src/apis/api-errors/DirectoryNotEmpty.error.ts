export class DirectoryNotEmptyError extends Error {
    constructor(msg?: string) {
        super(`You cannot delete a non-empty directory. ${msg ?? ""}`)
    }
}
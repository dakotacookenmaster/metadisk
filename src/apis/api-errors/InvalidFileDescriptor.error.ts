export class InvalidFileDescriptorError extends Error {
    constructor(msg?: string) {
        super(`The provided file descriptor is invalid. ${msg ?? ""}`)
    }
}
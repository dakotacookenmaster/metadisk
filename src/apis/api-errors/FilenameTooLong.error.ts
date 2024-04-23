export class FilenameTooLongError extends Error {
    constructor(msg?: string) {
        super(`The filename you provided is too long. The system can only support a maximum of 13 characters in the filename. ${msg ?? ""}`)
    }
}
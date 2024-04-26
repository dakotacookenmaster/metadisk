export class OpenFlagError extends Error {
    constructor(msg?: string) {
        super(`A call to 'open' must include one (and only one) of the following flags: O_RDONLY, O_WRONLY, O_RDWR. ${msg ?? ""}`)
    }
}
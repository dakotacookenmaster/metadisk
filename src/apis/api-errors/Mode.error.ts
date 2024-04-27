export class ModeError extends Error {
    constructor(msg?: string) {
        super(`A call to 'open' with the O_CREAT flag must include a mode. ${msg ?? ""}`)
    }
}
export class AccessDeniedError extends Error {
    constructor(msg?: string) {
        super(`You do not have the appropriate permissions to access this item. ${msg ?? ""}`)
    }
}
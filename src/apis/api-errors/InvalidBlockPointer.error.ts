export class InvalidBlockPointerError extends Error {
    constructor(msg?: string) {
        super(`A block pointer must be between 0 and 15 (inclusive). ${msg ?? ""}`)
    }
}
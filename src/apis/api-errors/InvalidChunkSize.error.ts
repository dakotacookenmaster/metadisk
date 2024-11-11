export class InvalidChunkSizeError extends Error {
    constructor(msg?: string) {
        super(`You provided an invalid chunk size. The initial array buffer must be evenly divisible by the chunk size. ${msg ?? ""}`)
    }
}
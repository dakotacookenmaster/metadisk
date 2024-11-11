export class SectorUnderflowError extends Error {
    constructor(msg?: string) {
        super(`The data you provided is too small to be written to a sector. Make sure to provide data for an entire sector, based on the sector size. ${msg ?? ""}`)
    }
}
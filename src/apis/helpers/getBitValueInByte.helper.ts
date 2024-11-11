export default function getBitValueInByte(byte: number, position: number): boolean {
    if(position < 0 || position > 7) {
        throw new Error("Position out of bounds for byte")
    }

    return !!((byte >> (7 - position)) & 1)
}
export default function dec2bin(dec: number, size: number = 8) {
    return (dec >>> 0).toString(2).padStart(size, "0")
}

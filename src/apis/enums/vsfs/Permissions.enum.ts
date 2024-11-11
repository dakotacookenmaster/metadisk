enum Permissions {
    READ = 0b010000,
    WRITE = 0b000100,
    EXECUTE = 0b000001,
    READ_WRITE = 0b010100,
    READ_EXECUTE = 0b010001,
    WRITE_EXECUTE = 0b000101,
    READ_WRITE_EXECUTE = 0b010101
}

export default Permissions
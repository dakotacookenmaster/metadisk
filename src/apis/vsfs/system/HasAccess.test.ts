import { test, expect } from "vitest"
import hasAccess from "./HasAccess.vsfs"
import OpenFlags from "../../enums/vsfs/OpenFlags.enum"
import Permissions from "../../enums/vsfs/Permissions.enum"

test("it should verify the user has the appropriate permissions to access the file", () => {
    // read tests
    expect(hasAccess([OpenFlags.O_RDONLY], Permissions.READ)).toBe(true)
    expect(hasAccess([OpenFlags.O_RDONLY], Permissions.WRITE)).toBe(false)
    expect(hasAccess([OpenFlags.O_RDONLY], Permissions.EXECUTE)).toBe(false)
    expect(hasAccess([OpenFlags.O_RDONLY], Permissions.READ_WRITE)).toBe(true)
    expect(hasAccess([OpenFlags.O_RDONLY], Permissions.READ_EXECUTE)).toBe(true)
    expect(hasAccess([OpenFlags.O_RDONLY], Permissions.WRITE_EXECUTE)).toBe(false)
    expect(hasAccess([OpenFlags.O_RDONLY], Permissions.READ_WRITE_EXECUTE)).toBe(true)

    // read / write tests
    expect(hasAccess([OpenFlags.O_RDWR], Permissions.READ)).toBe(false)
    expect(hasAccess([OpenFlags.O_RDWR], Permissions.WRITE)).toBe(false)
    expect(hasAccess([OpenFlags.O_RDWR], Permissions.EXECUTE)).toBe(false)
    expect(hasAccess([OpenFlags.O_RDWR], Permissions.READ_WRITE)).toBe(true)
    expect(hasAccess([OpenFlags.O_RDWR], Permissions.READ_EXECUTE)).toBe(false)
    expect(hasAccess([OpenFlags.O_RDWR], Permissions.WRITE_EXECUTE)).toBe(false)
    expect(hasAccess([OpenFlags.O_RDWR], Permissions.READ_WRITE_EXECUTE)).toBe(true)

    // write-only tests
    expect(hasAccess([OpenFlags.O_WRONLY], Permissions.READ)).toBe(false)
    expect(hasAccess([OpenFlags.O_WRONLY], Permissions.WRITE)).toBe(true)
    expect(hasAccess([OpenFlags.O_WRONLY], Permissions.EXECUTE)).toBe(false)
    expect(hasAccess([OpenFlags.O_WRONLY], Permissions.READ_WRITE)).toBe(true)
    expect(hasAccess([OpenFlags.O_WRONLY], Permissions.READ_EXECUTE)).toBe(false)
    expect(hasAccess([OpenFlags.O_WRONLY], Permissions.WRITE_EXECUTE)).toBe(true)
    expect(hasAccess([OpenFlags.O_WRONLY], Permissions.READ_WRITE_EXECUTE)).toBe(true)
})

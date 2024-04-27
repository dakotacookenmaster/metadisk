import OpenFlags from "../../enums/vsfs/OpenFlags.enum";
import Permissions from "../../enums/vsfs/Permissions.enum";

/**
 * Determines whether the open flags of a file are a subset of the file's permissions
 * @param expected The permissions you're attempting to use to access the resource
 * @param actual The actual permissions of the resource
 */
export default function hasAccess(expected: OpenFlags[], actual: Permissions): boolean {
    if(actual === Permissions.READ_WRITE_EXECUTE || actual === Permissions.READ_WRITE) {
        return true
    }
    if((actual === Permissions.READ || actual === Permissions.READ_EXECUTE) && expected.includes(OpenFlags.O_RDONLY)) {
        return true
    }
    if((actual === Permissions.WRITE || actual === Permissions.WRITE_EXECUTE) && expected.includes(OpenFlags.O_WRONLY)) {
        return true
    }
    return false
}
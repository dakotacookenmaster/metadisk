import { InvalidDirectoryPath } from "../../../apis/api-errors/InvalidDirectoryPath.error";
import listing from "../../../apis/vsfs/posix/listing.vsfs";
import getInodeLocation from "../../../apis/vsfs/system/GetInodeLocation.vsfs";
import { readBlock } from "../../../apis/vsfs/system/ReadBlock.vsfs";
import FileHierarchy from "../interfaces/FileHierarchy.interface";

export default async function getFileHierarchy(hierarchy: FileHierarchy): Promise<FileHierarchy> {
    if(hierarchy.type !== "directory") {
        throw new InvalidDirectoryPath()
    }
    const entries = (await listing(hierarchy.pathname)).entries.filter(entry => !entry.free)
    for(let entry of entries) {
        const { inodeBlock, inodeOffset } = getInodeLocation(entry.inode)
        const inodeData = (await readBlock(inodeBlock)).data.inodes[inodeOffset]
        if(inodeData.type === "file") {
            hierarchy.children.push({
                inode: entry.inode,
                pathname: hierarchy.pathname === "/" ? hierarchy.pathname + entry.name : hierarchy.pathname + "/" + entry.name,
                type: "file",
                children: []
            })
        } else if(entry.name === "." || entry.name === "..") {
            // do nothing to the hierarchy...these are cyclic references
        } else {
            const dirHierarchy = await getFileHierarchy({
                pathname: hierarchy.pathname === "/" ? hierarchy.pathname + entry.name : hierarchy.pathname + "/" + entry.name,
                inode: entry.inode,
                type: "directory",
                children: []
            })
            hierarchy.children.push(dirHierarchy)
        }
    }
    return hierarchy
}
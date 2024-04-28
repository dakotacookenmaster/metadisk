export default interface FileHierarchy {
    pathname: string,
    type: "file" | "directory",
    inode: number
    children: FileHierarchy[]
}
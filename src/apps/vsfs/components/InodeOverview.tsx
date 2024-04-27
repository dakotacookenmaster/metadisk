import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableRow,
    useTheme,
} from "@mui/material"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import CancelIcon from "@mui/icons-material/Cancel"
import FileIcon from "@mui/icons-material/Description"
import FolderIcon from "@mui/icons-material/Folder"
import { getByteCount } from "../../disk-simulator/components/SetUpDisk"
import { chunk } from "lodash"
import { blue } from "@mui/material/colors"
import { useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectBlockSize,
    selectSuperblock,
} from "../../../redux/reducers/fileSystemSlice"

const InodeOverview = (props: {
    data: string
    setSelected: React.Dispatch<React.SetStateAction<string>>
    canMove: boolean
    beginOperation: () => void
    blockRefs: React.RefObject<unknown>[],
    blockNumber: number
    setSelectedInode: React.Dispatch<React.SetStateAction<number | undefined>>
    selectedInode: number | undefined
    setBlockNumber: React.Dispatch<React.SetStateAction<number>>
    inodeBitmap: string
}) => {
    const {
        data,
        setSelected,
        canMove,
        beginOperation,
        blockNumber,
        blockRefs,
        setSelectedInode,
        selectedInode,
        setBlockNumber,
        inodeBitmap,
    } = props
    const superblock = useAppSelector(selectSuperblock)
    const blockSize = useAppSelector(selectBlockSize)
    const inodesPerBlock = blockSize / superblock.inodeSize
    const offset = selectedInode !== undefined ? selectedInode * 128 : 0 // 128 bits is the size of an inode
    const type = [<FileIcon />, <FolderIcon sx={{ color: "#F1D592" }} />][
        parseInt(data.slice(0 + offset, 2 + offset), 2)
    ]
    const options = [
        <CancelIcon color="error" />,
        <CheckCircleOutlineIcon color="success" />,
    ]
    const read = options[parseInt(data.slice(2 + offset, 4 + offset), 2)]
    const write = options[parseInt(data.slice(4 + offset, 6 + offset), 2)]
    const execute = options[parseInt(data.slice(6 + offset, 8 + offset), 2)]
    const size = getByteCount(parseInt(data.slice(8 + offset, 32 + offset), 2))

    const createdAt = new Date(
        parseInt(data.slice(32 + offset, 64 + offset), 2) * 1000,
    ).toLocaleString()
    const lastModified = new Date(
        parseInt(data.slice(64 + offset, 96 + offset), 2) * 1000,
    ).toLocaleString()
    const blockPointers = chunk(
        data.slice(96 + offset, 128 + offset).split(""),
        4,
    ).map((nibble) => parseInt(nibble.join(""), 2))
    const theme = useTheme()

    // remove any inodes that aren't available in the inode bitmap
    const inodeNumbers: number[] = []
    const inodes = chunk(data.split(""), superblock.inodeSize).filter(
        (_, i) => {
            if(inodeBitmap[i + blockNumber * inodesPerBlock] !== "0") {
                inodeNumbers.push(i)
                return true
            } 
            return false
        }
    )

    if (selectedInode === undefined) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: theme.spacing(2),
                }}
            >
                <Box
                    style={{
                        scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                        scrollbarWidth: "thin",
                        width: "100%",
                        maxHeight: "400px",
                        overflow: "auto",
                        paddingRight: theme.spacing(2),
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        gap: theme.spacing(1),
                    }}
                >
                    {inodes.length > 0 ? (
                        inodes.map((_, index) => {
                            return (
                                <Box
                                    key={`inode-box-${inodeNumbers[index]}`}
                                    sx={{
                                        width: "70px",
                                        height: "70px",
                                        borderRadius: "10px",
                                        border: "3px solid white",
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        "&:hover": {
                                            background:
                                                theme.palette.primary.main,
                                            border: "none",
                                            cursor: "pointer",
                                        },
                                    }}
                                    onClick={() => {
                                        setSelectedInode(index)
                                    }}
                                >
                                    {inodeNumbers[index] + blockNumber * inodesPerBlock}
                                </Box>
                            )
                        })
                    ) : (
                        <Box>No Inodes to Show</Box>
                    )}
                </Box>
            </Box>
        )
    }

    return (
        <Table sx={{ overflow: "auto" }}>
            <TableBody>
                <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>{type}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell sx={{ minWidth: "200px" }}>
                        Read / Write / Execute
                    </TableCell>
                    <TableCell>
                        {read} {write} {execute}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Size</TableCell>
                    <TableCell>{size}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Created</TableCell>
                    <TableCell>{createdAt}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Last Modified</TableCell>
                    <TableCell>{lastModified}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Block Pointers</TableCell>
                    <TableCell
                        sx={{
                            display: "flex",
                            gap: theme.spacing(1),
                            alignItems: "self-end",
                        }}
                    >
                        {blockPointers.map((pointer, index) =>
                            pointer === 0 ? (
                                <Box
                                    key={`block-pointer-${index}`}
                                    sx={{
                                        "&:hover": {
                                            cursor: "not-allowed",
                                            userSelect: "none",
                                        },
                                    }}
                                    fontFamily="u0000"
                                    fontSize="25px"
                                >
                                    {"\uE400"}
                                </Box>
                            ) : (
                                <Box
                                    key={`${pointer}-${index}`}
                                    sx={{
                                        width: "30px",
                                        height: "30px",
                                        border: "2px solid white",
                                        borderRadius: "5px",
                                        fontFamily: "u0000",
                                        display: "flex",
                                        fontWeight: "bold",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        padding: "5px",
                                        "&:hover": {
                                            background:
                                                theme.palette.primary.main,
                                            cursor:
                                                canMove && pointer !== 0
                                                    ? "pointer"
                                                    : "not-allowed",
                                            border: "none",
                                        },
                                    }}
                                    onClick={() => {
                                        if (canMove) {
                                            beginOperation()
                                            setSelected(
                                                `Data Block ${
                                                    pointer -
                                                    3 -
                                                    superblock.numberOfInodeBlocks
                                                }`,
                                            )
                                            setBlockNumber(pointer)
                                            const ref = blockRefs[pointer].current as Element
                                            ref.scrollIntoView({ behavior: "smooth" })
                                        }
                                    }}
                                >
                                    {pointer}
                                </Box>
                            ),
                        )}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}

export default InodeOverview

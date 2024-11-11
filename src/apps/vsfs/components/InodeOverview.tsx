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
import { blue, green } from "@mui/material/colors"
import { useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectBlockSize,
    selectSuperblock,
} from "../../../redux/reducers/fileSystemSlice"
import Uint8ArrayChunk from "../../../apis/helpers/Uint8ArrayChunk.helper"

const InodeOverview = (props: {
    data: Uint8Array
    setSelected: React.Dispatch<React.SetStateAction<string>>
    canMove: boolean
    beginOperation: () => void
    blockRefs: React.RefObject<unknown>[]
    blockNumber: number
    setSelectedInode: React.Dispatch<React.SetStateAction<number | undefined>>
    selectedInode: number | undefined
    setBlockNumber: React.Dispatch<React.SetStateAction<number>>
    inodeBitmap: Uint8Array
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
    const inodeStartIndex = superblock.inodeStartIndex
    const inodesPerBlock = blockSize / superblock.inodeSize
    const offset =
        selectedInode !== undefined ? (selectedInode % inodesPerBlock) * 16 : 0 // 16 bytes is the size of an inode
    const type = [<FileIcon />, <FolderIcon sx={{ color: "#F1D592" }} />][
        data[offset] >> 6
    ]
    const options = [
        <CancelIcon color="error" />,
        <CheckCircleOutlineIcon color="success" />,
    ]

    const read = options[(data[offset] >> 4) & 0b11]
    const write = options[(data[offset] >> 2) & 0b11]
    const execute = options[data[offset] & 0b11]

    const size =
        (data[offset + 1] << 16) |
        ((data[offset + 2] << 8) & 0xff) |
        (data[offset + 3] & 0xff)

    console.log(data[offset + 1], data[offset + 2], data[offset + 3])

    const createdAt = new Date(
        ((data[offset + 4] << 24) |
            ((data[offset + 5] << 16) & 0xff) |
            ((data[offset + 6] << 8) & 0xff) |
            (data[offset + 7] & 0xff)) *
            1000,
    ).toLocaleString()
    const lastModified = new Date(
        ((data[offset + 8] << 24) |
            ((data[offset + 8] << 16) & 0xff) |
            ((data[offset + 10] << 8) & 0xff) |
            (data[offset + 11] & 0xff)) *
            1000,
    ).toLocaleString()

    const blockPointers = [
        data[offset + 12] >> 4,
        data[offset + 12] & 0xf,
        data[offset + 13] >> 4,
        data[offset + 13] & 0xf,
        data[offset + 14] >> 4,
        data[offset + 14] & 0xf,
        data[offset + 15] >> 4,
        data[offset + 15] & 0xf,
    ]
    const theme = useTheme()

    // remove any inodes that aren't available in the inode bitmap
    const inodeNumbers: number[] = []

    const inodeBitmapAsString = Array.from(inodeBitmap)
        .map((num) => num.toString(2).padStart(8, "0"))
        .join("")
    const inodes = Uint8ArrayChunk(data, superblock.inodeSize)
        .map((arr) => {
            return Array.from(arr).map((num) =>
                num.toString(2).padStart(8, "0"),
            )
        })
        .filter((_, i) => {
            if (inodeBitmapAsString[i + blockNumber * inodesPerBlock] !== "0") {
                inodeNumbers.push(i)
                return true
            }
            return false
        })

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
                                        borderRadius: "100%",
                                        border: "3px solid white",
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        "&:hover": {
                                            background: green[600],
                                            border: "none",
                                            cursor: "pointer",
                                        },
                                    }}
                                    onClick={() => {
                                        setSelectedInode(index)
                                    }}
                                >
                                    {inodeNumbers[index] +
                                        blockNumber * inodesPerBlock}
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
        <Table sx={{ overflow: "auto", tableLayout: "fixed" }}>
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
                                        minWidth: "29px",
                                        minHeight: "29px",
                                        height: "29px",
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
                                                    inodeStartIndex -
                                                    superblock.numberOfInodeBlocks
                                                }`,
                                            )
                                            setBlockNumber(pointer)
                                            const ref = blockRefs[pointer]
                                                .current as Element
                                            ref.scrollIntoView({
                                                behavior: "smooth",
                                                block: "nearest",
                                            })
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

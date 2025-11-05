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
import { blue, green, grey } from "@mui/material/colors"
import { useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectBlockSize,
    selectSuperblock,
} from "../../../redux/reducers/fileSystemSlice"
import { readBits } from "../../../apis/utils/BitBuffer.utils"

const InodeOverview = (props: {
    data: Uint8Array
    setSelected: React.Dispatch<React.SetStateAction<string>>
    canMove: boolean
    beginOperation: () => void
    blockRefs: React.RefObject<unknown>[],
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
    const offset = selectedInode !== undefined ? (selectedInode % inodesPerBlock)* 128 : 0 // 128 bits is the size of an inode
    const type = [<FileIcon />, <FolderIcon sx={{ color: "#F1D592" }} />][
        readBits(data, 0 + offset, 2)
    ]
    const options = [
        <CancelIcon color="error" />,
        <CheckCircleOutlineIcon color="success" />,
    ]
    const read = options[readBits(data, 2 + offset, 2)]
    const write = options[readBits(data, 4 + offset, 2)]
    const execute = options[readBits(data, 6 + offset, 2)]
    const size = getByteCount(readBits(data, 8 + offset, 24))

    const createdAt = new Date(
        readBits(data, 32 + offset, 32) * 1000,
    ).toLocaleString()
    const lastModified = new Date(
        readBits(data, 64 + offset, 32) * 1000,
    ).toLocaleString()
    const blockPointers: number[] = []
    for (let i = 0; i < 8; i++) {
        blockPointers.push(readBits(data, 96 + offset + i * 4, 4))
    }
    const theme = useTheme()

    // Check each inode's allocation status in the bitmap
    const inodeNumbers: { inodeNumber: number, allocated: boolean}[] = []
    for (let i = 0; i < inodesPerBlock; i++) {
        const inodeIndex = i + blockNumber * inodesPerBlock
        const byteIndex = Math.floor(inodeIndex / 8)
        const bitIndex = 7 - (inodeIndex % 8)
        const allocated = (inodeBitmap[byteIndex] & (1 << bitIndex)) !== 0
        inodeNumbers.push({
            inodeNumber: i,
            allocated,
        })
    }

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
                    {inodeNumbers.length > 0 ? (
                        inodeNumbers.map((_, index) => {
                            return (
                                <Box
                                    key={`inode-box-${inodeNumbers[index].inodeNumber}`}
                                    sx={{
                                        width: "70px",
                                        height: "70px",
                                        borderRadius: "100%",
                                        border: "3px solid white",
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        display: "flex",
                                        alignItems: "center",
                                        userSelect: "none",
                                        justifyContent: "center",
                                        cursor: inodeNumbers[index].allocated ? "pointer" : "not-allowed",
                                        background: inodeNumbers[index].allocated ? theme.palette.success.main : grey[400],
                                        "&:hover": {
                                            background: inodeNumbers[index].allocated ? green[600] : undefined,
                                            border: inodeNumbers[index].allocated ? "none" : undefined,
                                        },
                                    }}
                                    onClick={() => {
                                        if(inodeNumbers[index].allocated) {
                                            setSelectedInode(index)
                                        }
                                    }}
                                >
                                    {inodeNumbers[index].inodeNumber + blockNumber * inodesPerBlock}
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
        <Table sx={{ overflow: "auto", tableLayout: "fixed", }}>
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
                                        background: theme.palette.success.main,
                                        padding: "5px",
                                        "&:hover": {
                                            background:
                                                green[800],
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
                                            const ref = blockRefs[pointer].current as Element
                                            ref.scrollIntoView({ behavior: "smooth", block: "nearest" })
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

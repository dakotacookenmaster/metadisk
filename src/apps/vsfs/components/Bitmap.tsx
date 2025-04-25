import { Box, Pagination, PaginationItem } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { blue } from "@mui/material/colors"
import { useState } from "react"
import { chunk } from "lodash"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"
import getInodeLocation from "../../../apis/vsfs/system/GetInodeLocation.vsfs"

const Bitmap = (props: {
    data: string
    type: "inode" | "data"
    setSelectedInode: React.Dispatch<React.SetStateAction<number | undefined>>
    setBlockNumber: React.Dispatch<React.SetStateAction<number>>
    setSelected: React.Dispatch<React.SetStateAction<string>>
}) => {
    const theme = useTheme()
    const { data, type, setBlockNumber, setSelectedInode, setSelected } = props
    const pageData = chunk(data.split(""), 256)
    const [page, setPage] = useState(1)
    const superblock = useAppSelector(selectSuperblock)
    const inodeStartIndex = superblock.inodeStartIndex
    const numberOfInodeBlocks = superblock.numberOfInodeBlocks

    const upperLimit =
        type === "data"
            ? superblock.numberOfDataBlocks
            : superblock.numberOfInodes

    const getColor = (char: string, index: number) => {
        if (index >= upperLimit) {
            return "grey"
        }
        if (char === "1") {
            return theme.palette.success.main
        } else {
            return theme.palette.error.main
        }
    }

    return (
        <Box
            style={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(3),
                alignItems: "center",
            }}
        >
            <Box
                sx={{
                    paddingRight: theme.spacing(2),
                    justifyContent: "center",
                    maxHeight: "350px",
                    overflowY: "auto",
                    scrollbarColor: `${theme.palette.primary.main} ${blue[200]}`,
                    scrollbarWidth: "thin",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: theme.spacing(1),
                    height: "100%",
                    width: "100%",
                }}
            >
                {pageData[page - 1]
                    .join("")
                    .split("")
                    .map((char, i) => {
                        return (
                            <Box
                                data-testid={`bit-${(page - 1) * 256 + i}`}
                                key={`bit-${i}`}
                                style={{
                                    display: "flex",
                                    fontWeight: "bold",
                                    borderRadius:
                                        type === "inode" ? "100%" : "2px",
                                    alignItems: "center",
                                    fontSize:
                                        i + (page - 1) * 256 > 9999
                                            ? "12px"
                                            : "16px",
                                    justifyContent: "center",
                                    width: "50px",
                                    height: "50px",
                                    border: "2px solid white",
                                    background: getColor(
                                        char,
                                        i + (page - 1) * 256,
                                    ),
                                    cursor:
                                        i + (page - 1) * 256 >= upperLimit || char === "0"
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                                onClick={() => {
                                    const currentIndex = i + (page - 1) * 256
                                    if (currentIndex < upperLimit && char !== "0") {
                                        if (type === "inode") {
                                            const { inodeBlock } =
                                                getInodeLocation(currentIndex)
                                            setSelectedInode(currentIndex)
                                            setBlockNumber(inodeBlock)
                                            setSelected(
                                                `Inode Block ${inodeStartIndex - inodeBlock}`,
                                            )
                                        } else {
                                            setSelectedInode(undefined)
                                            setBlockNumber(currentIndex + inodeStartIndex + numberOfInodeBlocks)
                                            setSelected(
                                                "Data Block " + currentIndex,
                                            )
                                        }
                                    }
                                }}
                            >
                                {i + (page - 1) * 256}
                            </Box>
                        )
                    })}
            </Box>
            <Pagination
                count={pageData.length}
                renderItem={(params) => {
                    return (
                        <PaginationItem data-testid={params.type} {...params} />
                    )
                }}
                onChange={(_, page) => {
                    setPage(page)
                }}
            />
        </Box>
    )
}

export default Bitmap

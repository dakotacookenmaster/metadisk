import { Box, Pagination, PaginationItem, useTheme } from "@mui/material"
import { blue } from "@mui/material/colors"
import { useState } from "react"
import { chunk } from "lodash"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectSuperblock } from "../../../redux/reducers/fileSystemSlice"

const Bitmap = (props: { data: string, type: "inode" | "data" }) => {
    const theme = useTheme()
    let { data, type } = props
    const pageData = chunk(data.split(""), 256)
    const [page, setPage] = useState(1)
    const superblock = useAppSelector(selectSuperblock)
    
    const upperLimit = type === "data" ? superblock.numberOfDataBlocks : superblock.numberOfInodes

    const getColor = (char: string, index: number) => {
        if(index >= upperLimit) {
            return "grey"
        }
        if(char === "0") {
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
                                data-testid={`bit-${((page - 1) * 256) + i}`}
                                key={`bit-${i}`}
                                style={{
                                    display: "flex",
                                    fontWeight: "bold",
                                    borderRadius: "2px",
                                    alignItems: "center",
                                    fontSize: (i + (page - 1) * 256) > 9999 ? "12px" : "16px",
                                    justifyContent: "center",
                                    width: "50px",
                                    height: "50px",
                                    border: "2px solid white",
                                    background: getColor(char, i + (page - 1) * 256)
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
                    return <PaginationItem data-testid={params.type} {...params} />
                }}
                onChange={(_, page) => {
                    setPage(page)
                }}
            />
        </Box>
    )
}

export default Bitmap

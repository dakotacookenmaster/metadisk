import { Box, Pagination, useTheme } from "@mui/material"
import { blue } from "@mui/material/colors"
import { useState } from "react"
import { chunk } from "lodash"

const Bitmap = (props: { data: string }) => {
    const theme = useTheme()
    let { data } = props
    const pageData = chunk(data.split(""), 256)
    const [page, setPage] = useState(1)
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
                    overflowY: "scroll",
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
                                    background:
                                        char === "0"
                                            ? theme.palette.success.main
                                            : theme.palette.error.main,
                                }}
                            >
                                {i + (page - 1) * 256}
                            </Box>
                        )
                    })}
            </Box>
            <Pagination
                count={pageData.length}
                onChange={(_, page) => {
                    setPage(page)
                }}
            />
        </Box>
    )
}

export default Bitmap

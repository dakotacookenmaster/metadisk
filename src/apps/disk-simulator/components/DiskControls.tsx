import { Typography } from "@mui/material"
import Box, { BoxProps } from "@mui/material/Box"
import Slider from "@mui/material/Slider"
import { useAppDispatch } from "../../../redux/hooks/hooks"
import {
    setDiskSpeed,
} from "../../../redux/reducers/diskSlice"
import { useState } from "react"

export default function DiskControls(props: BoxProps) {
    const dispatch = useAppDispatch()
    const [value, setValue] = useState("Fast")
    const marks = [
        {
            value: 0.03,
            label: "Uber Slow",
        },
        {
            value: 0.1,
            label: "Slow",
        },
        {
            value: 0.3,
            label: "Moderate",
        },
        {
            value: 0.6,
            label: "Fast",
        },
        {
            value: 1.0,
            label: "Very Fast",
        },
    ]

    function valuetext(value: number) {
        return marks[value].label
    }

    return (
        <Box {...props}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    paddingTop: "10px"
                }}
            >
                <Typography variant="overline" fontWeight={"bold"}>
                    Speed: { value }
                </Typography>
                <Slider
                    aria-label="Disk Speed"
                    defaultValue={3}
                    valueLabelFormat={(value: number) => {
                        return marks[value].label
                    }}
                    getAriaValueText={valuetext}
                    sx={{ width: "120px", marginTop: "-10px" }}
                    data-testid={"slider"}
                    step={1}
                    min={0}
                    max={4}
                    onChange={(_, value: number | number[]) => {
                        setValue(marks[value as number].label)
                        dispatch(
                            setDiskSpeed(
                                marks[value as number].value,
                            ),
                        )
                    }}
                    valueLabelDisplay="auto"
                />
            </Box>
        </Box>
    )
}

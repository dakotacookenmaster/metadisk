import { Typography } from "@mui/material"
import Box, { BoxProps } from "@mui/material/Box"
import Slider from "@mui/material/Slider"
import { useAppDispatch, useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectRotationTimeInSeconds,
    setRotationTimeInSeconds,
} from "../../../redux/reducers/diskSlice"

export default function DiskControls(props: BoxProps) {
    const dispatch = useAppDispatch()
    const rotationTimeInSeconds = useAppSelector(selectRotationTimeInSeconds)
    const marks = [
        {
            value: 30,
            label: "2 RPM",
        },
        {
            value: 20,
            label: "3 RPM",
        },
        {
            value: 12,
            label: "5 RPM",
        },
        {
            value: 10,
            label: "6 RPM",
        },
        {
            value: 6,
            label: "10 RPM",
        },
        {
            value: 4,
            label: "15 RPM",
        },
    ]

    function valuetext(value: number) {
        return `${value} RPM`
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
                    Speed: {60 / rotationTimeInSeconds} RPM
                </Typography>
                <Slider
                    aria-label="Disk Speed"
                    defaultValue={4}
                    valueLabelFormat={(value: number) => marks[value].label}
                    getAriaValueText={valuetext}
                    sx={{ width: "120px", marginTop: "-10px" }}
                    step={1}
                    min={0}
                    max={5}
                    onChange={(_, value: number | number[]) => {
                        dispatch(
                            setRotationTimeInSeconds(
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

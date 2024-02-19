import { Box, useTheme } from "@mui/material"
import { useAppDispatch, useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectDiskState,
    selectRotationTimeInSeconds,
    selectTrackCount,
    setDiskRotation,
} from "../../../redux/reducers/diskSlice"
import {
    selectSectorsPerBlock,
    selectTotalBlocks,
} from "../../../redux/reducers/fileSystemSlice"
import React, { useEffect, useRef } from "react"
import getCurrentRotation from "../../common/helpers/getCurrentRotation"
import { MAX_DISK_WIDTH_PERCENTAGE } from "../../common/constants"

const DiskPlatter = () => {
    const trackCount = useAppSelector(selectTrackCount)
    const sectorsPerTrack =
        (useAppSelector(selectSectorsPerBlock) *
            useAppSelector(selectTotalBlocks)) /
        trackCount
    const trackSeparation = MAX_DISK_WIDTH_PERCENTAGE / (trackCount + 1)
    const platterRef = useRef<HTMLElement | null>(null)
    const diskState = useAppSelector(selectDiskState)
    const dispatch = useAppDispatch()
    const rotationTimeInSeconds = useAppSelector(selectRotationTimeInSeconds)
    const theme = useTheme()

    useEffect(() => {
        const id = setInterval(() => {
            if (platterRef.current) {
                dispatch(
                    setDiskRotation(getCurrentRotation(platterRef.current)),
                )
            }
        }, 1)

        return () => {
            clearInterval(id)
        }
    }, [])

    return (
        <Box
            ref={platterRef}
            className={diskState}
            sx={{
                animationDuration: `${rotationTimeInSeconds}s`,
                width: "500px",
                height: "500px",
                minWidth: "500px",
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "30px",
                borderRadius: "100%",
            }}
        >
            {[...Array(trackCount + 1)].map((_, i) => {
                return (
                    <React.Fragment key={`track-${i}`}>
                        <Box
                            sx={{
                                width: `${
                                    MAX_DISK_WIDTH_PERCENTAGE -
                                    trackSeparation * i
                                }%`,
                                aspectRatio: "1 / 1",
                                background: i % 2 === 0 ? "#2D2D2D" : "gray",
                                border: "2px solid white",
                                position: "absolute",
                                zIndex: i,
                                borderRadius: "100%",
                            }}
                        />
                        {i !== trackCount &&
                            [...Array(sectorsPerTrack)].map((_, ii) => {
                                const theta =
                                    (360 / sectorsPerTrack) *
                                    ii *
                                    (Math.PI / 180) // in radiians

                                const radius =
                                    (((MAX_DISK_WIDTH_PERCENTAGE -
                                        trackSeparation * (i + 0.5)) /
                                        100) *
                                        500) /
                                    2

                                const sectorNumber =
                                    ii + sectorsPerTrack * (trackCount - i - 1)
                                return (
                                    <Box
                                        sx={{
                                            width: "27px",
                                            height: "27px",
                                            color: "white",
                                            background:
                                                theme.palette.primary.main,
                                            borderRadius: "100%",
                                            fontWeight: "bold",
                                            position: "absolute",
                                            display: "flex",
                                            justifyContent: "center",
                                            border: "2px solid white",
                                            alignItems: "center",
                                            animationDuration: `${rotationTimeInSeconds}s`,
                                            left:
                                                radius * Math.sin(theta) + 235,
                                            top: radius * Math.cos(theta) + 235,
                                            zIndex: 10,
                                        }}
                                        className={`sector-${diskState}`}
                                        key={`track-${i}-sector-${ii}`}
                                    >
                                        {sectorNumber}
                                    </Box>
                                )
                            })}
                    </React.Fragment>
                )
            })}
        </Box>
    )
}

export default DiskPlatter

import { Box } from "@mui/material"
import { useAppDispatch, useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectDiskRotation,
    selectDiskState,
    selectTrackCount,
    setDiskRotation,
} from "../../../redux/reducers/diskSlice"
import {
    selectSectorsPerBlock,
    selectTotalBlocks,
} from "../../../redux/reducers/fileSystemSlice"
import React, { useEffect, useRef } from "react"
import getCurrentRotation from "../../common/helpers/getCurrentRotation"

const DiskPlatter = () => {
    const trackCount = useAppSelector(selectTrackCount)
    const sectorsPerTrack =
        (useAppSelector(selectSectorsPerBlock) *
            useAppSelector(selectTotalBlocks)) /
        trackCount
    const trackSeparation = 90 / trackCount
    const totalSectors = sectorsPerTrack * trackCount
    const platterRef = useRef<HTMLElement | null>(null)
    const diskState = useAppSelector(selectDiskState)
    const diskRotation = useAppSelector(selectDiskRotation)
    const dispatch = useAppDispatch()

    useEffect(() => {
        const id = setInterval(() => {
            if (platterRef.current) {
                dispatch(
                    setDiskRotation(getCurrentRotation(platterRef.current)),
                )
            }
        }, 100)

        return () => {
            clearInterval(id)
        }
    }, [])

    return (
        <Box
            ref={platterRef}
            className={diskState}
            sx={{
                width: "500px",
                height: "500px",
                minWidth: "500px",
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "30px",
                transform:
                    diskState === "idle"
                        ? `rotate(${diskRotation}deg)`
                        : undefined,
                borderRadius: "100%",
            }}
        >
            {[...Array(trackCount)].map((_, i) => {
                return (
                    <React.Fragment key={`track-${i}`}>
                        <Box
                            sx={{
                                width: `${90 - trackSeparation * i}%`,
                                aspectRatio: "1 / 1",
                                background: i % 2 === 0 ? "#2D2D2D" : "gray",
                                border: "2px solid white",
                                position: "absolute",
                                zIndex: i,
                                borderRadius: "100%",
                            }}
                        />
                        {[...Array(sectorsPerTrack)].map((_, ii) => {
                            const theta =
                                (360 / sectorsPerTrack) * ii * (Math.PI / 180) // in radiians
                            const radius =
                                (((90 - trackSeparation * i) / 100) * 500) / 2
                            return (
                                <Box
                                    sx={{
                                        padding: "5px",
                                        width: "30px",
                                        height: "30px",
                                        background: "orange",
                                        borderRadius: "100%",
                                        position: "absolute",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        left: radius * Math.sin(theta) + 235,
                                        top: radius * Math.cos(theta) + 235,
                                        transform:
                                            diskState === "idle"
                                                ? `rotate(-${diskRotation}deg)`
                                                : undefined,
                                        zIndex: 10,
                                    }}
                                    className={`sector-${diskState}`}
                                    key={`track-${i}-sector-${ii}`}
                                >
                                    {totalSectors -
                                        (sectorsPerTrack * i + ii) -
                                        1}
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

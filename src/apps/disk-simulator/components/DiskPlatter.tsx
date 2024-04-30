import { Box, useTheme } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectDiskSpeed,
    selectTrackCount,
} from "../../../redux/reducers/diskSlice"
import {
    selectSectorsPerBlock,
    selectTotalBlocks,
} from "../../../redux/reducers/fileSystemSlice"
import React, { useEffect, useRef } from "react"
import { MAX_DISK_WIDTH_PERCENTAGE } from "../../common/constants"

const DiskPlatter = () => {
    const trackCount = useAppSelector(selectTrackCount)
    const sectorsPerTrack =
        (useAppSelector(selectSectorsPerBlock) *
            useAppSelector(selectTotalBlocks)) /
        trackCount
    const trackSeparation = MAX_DISK_WIDTH_PERCENTAGE / (trackCount + 1)
    const platterRef = useRef<HTMLElement | null>(null)
    const sectorRefs = [...Array(sectorsPerTrack * trackCount)].map(() =>
        useRef<HTMLElement | null>(null),
    )
    const diskSpeed = useAppSelector(selectDiskSpeed)
    const theme = useTheme()
    const rotation = useRef(0)

    useEffect(() => {
        const interval = setInterval(() => {
            if (
                platterRef.current &&
                sectorRefs.every((sectorRef) => sectorRef.current)
            ) {
                for (let value = 0; value < 2; value++) {
                    rotation.current = (rotation.current + diskSpeed) % 360
                    platterRef.current.style.transform = `rotate(${rotation.current}deg)`
                    sectorRefs.forEach((sectorRef) => {
                        sectorRef.current!.style.transform = `rotate(${-rotation.current}deg)`
                    })
                    localStorage.setItem("rotation", `${rotation.current}`)
                }
            }
        })

        return () => {
            clearInterval(interval)
        }
    }, [diskSpeed])

    // useAnimationFrame(() => {

    //     if (
    //         platterRef.current &&
    //         sectorRefs.every((sectorRef) => sectorRef.current)
    //     ) {
    //         for (let value = 0; value < diskSpeed; value++) {
    //             rotation.current = (rotation.current + 1) /* diskSpeed */ % 360
    //             console.log("CURRENT ROTATION:", rotation.current)
    //             platterRef.current.style.transform = `rotate(${rotation.current}deg)`
    //             sectorRefs.forEach((sectorRef) => {
    //                 sectorRef.current!.style.transform = `rotate(${-rotation.current}deg)`
    //             })
    //             dispatch(setDiskRotation(rotation.current))
    //         }
    //     }
    // })

    return (
        <Box
            ref={platterRef}
            sx={{
                width: "500px",
                height: "500px",
                minWidth: "500px",
                position: "relative",
                transform: `rotate(${rotation}deg)`,
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
                                        ref={sectorRefs[sectorNumber]}
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
                                            transform: `rotate(${-rotation}deg)`,
                                            left:
                                                radius * Math.sin(theta) +
                                                (250 - 27 / 2),
                                            top:
                                                radius * Math.cos(theta) +
                                                (250 - 27 / 2),
                                            zIndex: 10,
                                        }}
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

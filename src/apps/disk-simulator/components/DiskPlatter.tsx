import { Box, useTheme } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import {
    selectDiskSpeed,
    selectPlatterRotation,
    selectTrackCount,
} from "../../../redux/reducers/diskSlice"
import {
    selectSectorsPerBlock,
    selectTotalBlocks,
} from "../../../redux/reducers/fileSystemSlice"
import React, { useEffect, useRef, useMemo, createRef } from "react"
import { MAX_DISK_WIDTH_PERCENTAGE } from "../../common/constants"

const DiskPlatter = () => {
    const trackCount = useAppSelector(selectTrackCount)
    const sectorsPerTrack =
        (useAppSelector(selectSectorsPerBlock) *
            useAppSelector(selectTotalBlocks)) /
        trackCount
    const trackSeparation = MAX_DISK_WIDTH_PERCENTAGE / (trackCount + 1)
    const platterRef = useRef<HTMLElement | null>(null)
    const sectorRefs = useMemo(
        () =>
            [...Array(sectorsPerTrack * trackCount)].map(() =>
                createRef<HTMLElement>(),
            ),
        [sectorsPerTrack, trackCount]
    )

    const diskSpeed = useAppSelector(selectDiskSpeed)
    const platterRotation = useAppSelector(selectPlatterRotation)
    const theme = useTheme()
    const animationFrameRef = useRef<number | null>(null)
    const logThrottleRef = useRef<number>(0)

    useEffect(() => {        
        const animate = () => {
            if (
                platterRef.current &&
                sectorRefs.every((sectorRef) => sectorRef.current)
            ) {
                // Use Date.now() to match the time reference in Redux state
                const currentTime = Date.now()
                
                // Calculate current rotation based on elapsed time from start
                const elapsedTime = (currentTime - platterRotation.startTime) / 1000
                const degreesPerSecond = diskSpeed * 120
                const totalDegrees = degreesPerSecond * elapsedTime
                const currentRotation = (platterRotation.startDegrees + totalDegrees) % 360
                
                // Throttled logging (once per second)
                const logKey = Math.floor(currentTime / 1000)
                if (logThrottleRef.current !== logKey) {
                    logThrottleRef.current = logKey
                }
                
                // Apply visual rotation (no Redux updates needed - calculation is deterministic)
                platterRef.current.style.transform = `rotate(${currentRotation}deg)`
                sectorRefs.forEach((sectorRef) => {
                    sectorRef.current!.style.transform = `rotate(${-currentRotation}deg)`
                })
            }
            
            // Continue animation loop
            animationFrameRef.current = requestAnimationFrame(animate)
        }
        
        // Start animation loop
        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [diskSpeed, platterRotation.startTime, platterRotation.startDegrees, sectorRefs])

    return (
        <Box
            ref={platterRef}
            sx={{
                width: "500px",
                height: "500px",
                minWidth: "500px",
                position: "relative",
                transform: `rotate(0deg)`, // Will be updated by animation loop
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
                                            transform: `rotate(0deg)`, // Will be updated by animation loop
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

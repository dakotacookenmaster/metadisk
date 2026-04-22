import { Box } from "@mui/material"

/**
 * 3D variant of DiskArm. Designed to live inside a parent with
 * `transform-style: preserve-3d` (e.g., DiskScene3D).
 *
 * Models a real-ish HDD voice-coil actuator:
 *   - Pivot hub:  a chunky N-sided prism (low-poly cylinder) with top/bottom caps
 *   - Arm shaft: a tapered triangular plate (clip-path) — wide at pivot, narrow at head
 *   - Head:      a small slider hanging just below the arm tip
 */

// --- Geometry ---------------------------------------------------------------
// IMPORTANT: in-plane (x/y) geometry is identical to the 2D arm so that
// `findSectorRotation` in diskSlice (which is hand-tuned to the 2D arm)
// produces correct sector-targeting angles. The pivot is visually lifted
// off the disc via Z elevation in DiskScene3D — under the 60° X-tilt,
// higher Z projects upward on screen, making the pivot appear above the
// platter without changing the sweep math.
const PIVOT_OFFSET = 0
const HEAD_DEPTH = 22
const ARM_LENGTH = 245
const ARM_WIDE = 28 // width at pivot end
const ARM_NARROW = 8 // width at head end
const ARM_THICKNESS = 8

const PIVOT_DIAMETER = 50
const PIVOT_HEIGHT = 28 // total Z height of pivot cylinder
const PIVOT_SIDES = 16 // segments for the low-poly cylinder

const HEAD_WIDTH = 20
const HEAD_HEIGHT = 6

// Clip path: trapezoid that tapers from wide (top, pivot side) to narrow (bottom, head side).
const taperClip = (() => {
    const wHalf = ARM_WIDE / 2
    const nHalf = ARM_NARROW / 2
    const cx = ARM_WIDE / 2
    return `polygon(${cx - wHalf}px 0, ${cx + wHalf}px 0, ${cx + nHalf}px ${ARM_LENGTH}px, ${cx - nHalf}px ${ARM_LENGTH}px)`
})()

// --- Pieces -----------------------------------------------------------------

const PivotCylinder = () => {
    const radius = PIVOT_DIAMETER / 2
    // Width of each side rectangle so they meet edge-to-edge around the circle
    const sideWidth = 2 * radius * Math.sin(Math.PI / PIVOT_SIDES) + 0.5 // small overlap
    const halfH = PIVOT_HEIGHT / 2

    return (
        <Box
            sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${PIVOT_DIAMETER}px`,
                height: `${PIVOT_DIAMETER}px`,
                transformStyle: "preserve-3d",
            }}
        >
            {/* Top cap */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "100%",
                    background:
                        "radial-gradient(circle at 35% 30%, #f0f0f0 0%, #888 70%, #444 100%)",
                    border: "2px solid maroon",
                    transform: `translateZ(${halfH}px)`,
                    boxShadow: "inset 0 -3px 5px rgba(0,0,0,0.4)",
                }}
            />
            {/* Bottom cap */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "100%",
                    background:
                        "radial-gradient(circle at 35% 30%, #888 0%, #333 70%, #1a1a1a 100%)",
                    border: "2px solid maroon",
                    transform: `translateZ(-${halfH}px) rotateX(180deg)`,
                }}
            />
            {/* Side faces (low-poly cylinder) */}
            {[...Array(PIVOT_SIDES)].map((_, i) => {
                const angleDeg = (360 / PIVOT_SIDES) * i
                return (
                    <Box
                        key={`pivot-side-${i}`}
                        aria-hidden
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: `calc(50% - ${sideWidth / 2}px)`,
                            width: `${sideWidth}px`,
                            height: `${PIVOT_HEIGHT}px`,
                            transformOrigin: `${sideWidth / 2}px ${PIVOT_HEIGHT / 2}px`,
                            transform: `translateY(${PIVOT_DIAMETER / 2 - PIVOT_HEIGHT / 2}px) rotateX(90deg) rotateY(${angleDeg}deg) translateZ(${radius}px)`,
                            background:
                                "linear-gradient(180deg, #b0b0b0 0%, #4a4a4a 50%, #b0b0b0 100%)",
                            borderTop: "1px solid #6a0000",
                            borderBottom: "1px solid #6a0000",
                        }}
                    />
                )
            })}
        </Box>
    )
}

const ArmShaft = () => {
    const halfT = ARM_THICKNESS / 2
    return (
        <Box
            sx={{
                position: "absolute",
                top: `${PIVOT_DIAMETER / 2}px`,
                left: `calc((${PIVOT_DIAMETER}px - ${ARM_WIDE}px) / 2)`,
                width: `${ARM_WIDE}px`,
                height: `${ARM_LENGTH}px`,
                transformStyle: "preserve-3d",
            }}
        >
            {/* Top face — tapered */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(180deg, #f5f5f5 0%, #c8c8c8 100%)",
                    clipPath: taperClip,
                    transform: `translateZ(${halfT}px)`,
                }}
            />
            {/* Bottom face — tapered */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    inset: 0,
                    background: "#444",
                    clipPath: taperClip,
                    transform: `translateZ(-${halfT}px) rotateX(180deg)`,
                }}
            />
            {/* Left slanted side */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: `${ARM_THICKNESS}px`,
                    height: `${Math.hypot(ARM_LENGTH, (ARM_WIDE - ARM_NARROW) / 2)}px`,
                    background:
                        "linear-gradient(90deg, #888 0%, #cfcfcf 50%, #888 100%)",
                    transformOrigin: "left top",
                    transform: `translateX(${(ARM_WIDE - ARM_NARROW) / 2 + ARM_NARROW}px) rotateZ(${
                        (Math.atan2((ARM_WIDE - ARM_NARROW) / 2, ARM_LENGTH) *
                            180) /
                        Math.PI
                    }deg) rotateY(90deg) translateX(-${halfT}px)`,
                }}
            />
            {/* Right slanted side */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: `${ARM_THICKNESS}px`,
                    height: `${Math.hypot(ARM_LENGTH, (ARM_WIDE - ARM_NARROW) / 2)}px`,
                    background:
                        "linear-gradient(90deg, #888 0%, #cfcfcf 50%, #888 100%)",
                    transformOrigin: "right top",
                    transform: `translateX(-${(ARM_WIDE - ARM_NARROW) / 2 + ARM_NARROW}px) rotateZ(-${
                        (Math.atan2((ARM_WIDE - ARM_NARROW) / 2, ARM_LENGTH) *
                            180) /
                        Math.PI
                    }deg) rotateY(-90deg) translateX(${halfT}px)`,
                }}
            />
            {/* End cap near pivot */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: `${ARM_WIDE}px`,
                    height: `${ARM_THICKNESS}px`,
                    background: "#7a7a7a",
                    transformOrigin: "center top",
                    transform: `rotateX(90deg) translateY(-${halfT}px)`,
                }}
            />
            {/* End cap near head */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: `calc((${ARM_WIDE}px - ${ARM_NARROW}px) / 2)`,
                    width: `${ARM_NARROW}px`,
                    height: `${ARM_THICKNESS}px`,
                    background: "#7a7a7a",
                    transformOrigin: "center bottom",
                    transform: `rotateX(-90deg) translateY(${halfT}px)`,
                }}
            />
        </Box>
    )
}

const HeadSlider = () => {
    const halfH = HEAD_HEIGHT / 2
    return (
        <Box
            sx={{
                position: "absolute",
                width: `${HEAD_WIDTH}px`,
                height: `${HEAD_DEPTH}px`,
                left: `calc((${PIVOT_DIAMETER}px - ${HEAD_WIDTH}px) / 2)`,
                top: `${PIVOT_DIAMETER / 2 + ARM_LENGTH - HEAD_DEPTH / 2}px`,
                transformStyle: "preserve-3d",
                transform: `translateZ(-${ARM_THICKNESS / 2 + halfH}px)`,
            }}
        >
            {/* Top */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(180deg, #ff8a8a 0%, #b00000 100%)",
                    border: "1px solid #6a0000",
                    transform: `translateZ(${halfH}px)`,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
                }}
            />
            {/* Bottom (gold contact pad look) */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(180deg, #d4a64a 0%, #8a6a1f 100%)",
                    border: "1px solid #6a0000",
                    transform: `translateZ(-${halfH}px) rotateX(180deg)`,
                }}
            />
            {/* Sides */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: `${HEAD_HEIGHT}px`,
                    height: `${HEAD_DEPTH}px`,
                    background: "#7a0000",
                    transformOrigin: "left center",
                    transform: `rotateY(-90deg) translateX(-${halfH}px)`,
                }}
            />
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: `${HEAD_HEIGHT}px`,
                    height: `${HEAD_DEPTH}px`,
                    background: "#7a0000",
                    transformOrigin: "right center",
                    transform: `rotateY(90deg) translateX(${halfH}px)`,
                }}
            />
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: `${HEAD_WIDTH}px`,
                    height: `${HEAD_HEIGHT}px`,
                    background: "#7a0000",
                    transformOrigin: "center top",
                    transform: `rotateX(90deg) translateY(-${halfH}px)`,
                }}
            />
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: `${HEAD_WIDTH}px`,
                    height: `${HEAD_HEIGHT}px`,
                    background: "#7a0000",
                    transformOrigin: "center bottom",
                    transform: `rotateX(-90deg) translateY(${halfH}px)`,
                }}
            />
        </Box>
    )
}

// --- Component --------------------------------------------------------------

const DiskArm3D = (props: { rotation: { degrees: number; time: number } }) => {
    const { rotation } = props

    return (
        <Box
            sx={{
                position: "absolute",
                width: `${PIVOT_DIAMETER}px`,
                height: `${PIVOT_DIAMETER + ARM_LENGTH + 20}px`,
                top: `-${PIVOT_OFFSET}px`,
                left: `calc(50% - ${PIVOT_DIAMETER / 2}px)`,
                transformOrigin: `${PIVOT_DIAMETER / 2}px ${PIVOT_DIAMETER / 2}px`,
                transform: `rotate(${rotation.degrees}deg)`,
                transition: `linear ${rotation.time}s`,
                transformStyle: "preserve-3d",
                zIndex: 2000,
            }}
        >
            <PivotCylinder />
            <ArmShaft />
            <HeadSlider />
        </Box>
    )
}

export default DiskArm3D

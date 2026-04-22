import { Box } from "@mui/material"
import DiskPlatter from "./DiskPlatter"

/**
 * Real 3D platter built from the existing 2D `DiskPlatter` as the top face,
 * a polished metallic bottom face, and a thin extruded rim made from many
 * narrow side panels (low-poly cylinder, but enough sides to read smooth).
 *
 * Real HDD platters are very thin relative to their diameter (~1mm thick on
 * a 95mm disc). Keeping the thickness small + the side count high is what
 * sells the look — earlier versions were too chunky and too faceted.
 */
const PLATTER_DIAMETER = 500
const PLATTER_THICKNESS = 28
const PLATTER_SIDES = 96

const Platter3D = () => {
    const radius = PLATTER_DIAMETER / 2
    // Slight overlap so seams between side panels disappear
    const sideWidth =
        2 * radius * Math.sin(Math.PI / PLATTER_SIDES) + 0.6
    const halfH = PLATTER_THICKNESS / 2

    return (
        <Box
            sx={{
                position: "absolute",
                inset: 0,
                width: `${PLATTER_DIAMETER}px`,
                height: `${PLATTER_DIAMETER}px`,
                transformStyle: "preserve-3d",
            }}
        >
            {/* Top face: the real animated platter */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    transform: `translateZ(${halfH}px)`,
                    transformStyle: "preserve-3d",
                }}
            >
                <DiskPlatter />
            </Box>

            {/* Bottom face: polished metallic mirror */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "100%",
                    background:
                        "radial-gradient(circle at 50% 35%, #f4f4f4 0%, #c8c8c8 35%, #5a5a5a 75%, #1a1a1a 100%)",
                    transform: `translateZ(-${halfH}px) rotateX(180deg)`,
                    boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
                }}
            />

            {/* Thin polished rim (low-poly cylinder, smooth thanks to high side count) */}
            {[...Array(PLATTER_SIDES)].map((_, i) => {
                const angleDeg = (360 / PLATTER_SIDES) * i
                return (
                    <Box
                        key={`platter-side-${i}`}
                        aria-hidden
                        sx={{
                            position: "absolute",
                            top: `calc(50% - ${PLATTER_THICKNESS / 2}px)`,
                            left: `calc(50% - ${sideWidth / 2}px)`,
                            width: `${sideWidth}px`,
                            height: `${PLATTER_THICKNESS}px`,
                            transformOrigin: `${sideWidth / 2}px ${PLATTER_THICKNESS / 2}px`,
                            transform: `rotateX(90deg) rotateY(${angleDeg}deg) translateZ(${radius}px)`,
                            background:
                                "linear-gradient(180deg, #d8d8d8 0%, #6a6a6a 50%, #d8d8d8 100%)",
                        }}
                    />
                )
            })}
        </Box>
    )
}

export default Platter3D

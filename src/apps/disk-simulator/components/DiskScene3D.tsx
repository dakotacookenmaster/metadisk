import { Box, useTheme } from "@mui/material"
import { useAppSelector } from "../../../redux/hooks/hooks"
import { selectArmRotation } from "../../../redux/reducers/diskSlice"
import DiskArm3D from "./DiskArm3D"
import Platter3D from "./Platter3D"

/**
 * 3D wrapper around the disk scene. Uses CSS perspective and a tilt on the
 * X axis so the platter appears to lay flat. The platter, spindle, and arm
 * are real extruded 3D shapes built from rotated CSS panels. Animation
 * logic is reused from the existing 2D components.
 */

const SPINDLE_DIAMETER = 44
const SPINDLE_HEIGHT = 36
const SPINDLE_SIDES = 32
const PLATTER_THICKNESS = 28

const Spindle3D = ({ color }: { color: string }) => {
    const radius = SPINDLE_DIAMETER / 2
    const sideWidth =
        2 * radius * Math.sin(Math.PI / SPINDLE_SIDES) + 0.5
    const halfH = SPINDLE_HEIGHT / 2
    return (
        <Box
            aria-hidden
            sx={{
                position: "absolute",
                top: `calc(50% - ${SPINDLE_DIAMETER / 2}px)`,
                left: `calc(50% - ${SPINDLE_DIAMETER / 2}px)`,
                width: `${SPINDLE_DIAMETER}px`,
                height: `${SPINDLE_DIAMETER}px`,
                transformStyle: "preserve-3d",
                // Lift so the bottom cap sits flush with the platter top
                transform: `translateZ(${PLATTER_THICKNESS / 2 + halfH}px)`,
                zIndex: 3000,
            }}
        >
            {/* Top cap */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "100%",
                    background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 60%, #1f2a44 100%)`,
                    border: "2px solid white",
                    transform: `translateZ(${halfH}px)`,
                    boxShadow: "inset 0 -3px 5px rgba(0,0,0,0.4)",
                }}
            />
            {/* Bottom cap (mostly hidden, but keeps the cylinder closed) */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "100%",
                    background: "#222",
                    transform: `translateZ(-${halfH}px) rotateX(180deg)`,
                }}
            />
            {/* Side panels (low-poly cylinder) */}
            {[...Array(SPINDLE_SIDES)].map((_, i) => {
                const angleDeg = (360 / SPINDLE_SIDES) * i
                return (
                    <Box
                        key={`spindle-side-${i}`}
                        sx={{
                            position: "absolute",
                            top: `calc(50% - ${SPINDLE_HEIGHT / 2}px)`,
                            left: `calc(50% - ${sideWidth / 2}px)`,
                            width: `${sideWidth}px`,
                            height: `${SPINDLE_HEIGHT}px`,
                            transformOrigin: `${sideWidth / 2}px ${SPINDLE_HEIGHT / 2}px`,
                            transform: `rotateX(90deg) rotateY(${angleDeg}deg) translateZ(${radius}px)`,
                            background: `linear-gradient(180deg, #d8d8d8 0%, ${color} 50%, #2a2a2a 100%)`,
                        }}
                    />
                )
            })}
        </Box>
    )
}

const DiskScene3D = () => {
    const armRotation = useAppSelector(selectArmRotation)
    const theme = useTheme()

    const tiltDegrees = 60

    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: "1600px",
                perspectiveOrigin: "50% 30%",
                minHeight: "560px",
                paddingTop: 0,
                marginTop: "-80px",
                pointerEvents: "none",
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    width: "500px",
                    height: "500px",
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${tiltDegrees}deg)`,
                }}
            >
                <Platter3D />

                <Spindle3D color={theme.palette.primary.main} />

                {/* The arm sits above the platter top face. Lifted in Z so the
                    pivot — which in 2D coords sits on the disc's top edge —
                    projects upward (under the 60° X-tilt) to appear off the
                    platter. The in-plane geometry stays identical to the 2D
                    arm so sector targeting math remains correct. */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        transform: `translateZ(${PLATTER_THICKNESS / 2 + 45}px)`,
                        transformStyle: "preserve-3d",
                        pointerEvents: "none",
                    }}
                >
                    <DiskArm3D rotation={armRotation} />
                </Box>
            </Box>
        </Box>
    )
}

export default DiskScene3D

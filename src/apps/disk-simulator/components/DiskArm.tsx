import { Box } from "@mui/material"
import { useEffect, useRef } from "react"
import { useAppDispatch } from "../../../redux/hooks/hooks"
import { setArmRotationReference } from "../../../redux/reducers/diskSlice"
import getCurrentRotation from "../../common/helpers/getCurrentRotation"

const DiskArm = (props: { rotation: { degrees: number; time: number } }) => {
    const { rotation } = props
    const armRef = useRef(null)
    const dispatch = useAppDispatch()

    useEffect(() => {
        setInterval(() => {
            if (armRef.current) {
                dispatch(
                    setArmRotationReference(getCurrentRotation(armRef.current)),
                )
            }
        }, 1)
    }, [])

    return (
        <Box
            ref={armRef}
            sx={{
                position: "absolute",
                width: "50px",
                height: "300px",
                zIndex: 2000,
                top: 0,
                left: "calc(50% - 25px)",
                transformOrigin: "25px 25px",
                transform: `rotate(${rotation.degrees}deg)`,
                transition: `linear ${rotation.time}s`,
            }}
        >
            <Box
                sx={{
                    background: "gray",
                    width: "50px",
                    height: "50px",
                    borderRadius: "100%",
                    position: "absolute",
                    zIndex: 1,
                    border: "2px solid maroon",
                }}
            />
            <Box
                sx={{
                    width: "15px",
                    height: "260px",
                    top: "10px",
                    background: "white",
                    position: "absolute",
                    left: "calc((50px - 15px) / 2)",
                    zIndex: 0,
                    border: "4px solid maroon",
                }}
            />
            <Box
                sx={{
                    width: "30px",
                    height: "30px",
                    background: "red",
                    borderRadius: "100%",
                    left: "10px",
                    top: "255px",
                    position: "absolute",
                    zIndex: 2,
                    border: "2px solid white",
                }}
            />
        </Box>
    )
}

export default DiskArm

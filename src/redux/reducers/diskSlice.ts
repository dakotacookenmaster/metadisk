import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { AppDispatch, RootState } from "../../store"
import {
    CurrentlyServicingPayload,
    ReadPayload,
    WritePayload,
} from "../../apis/disk"
import { MAX_DISK_WIDTH_PERCENTAGE } from "../../apps/common/constants"

interface DiskState {
    state: "read" | "write" | "idle" | "seek"
    rotationTimeInSeconds: number
    trackCount: 1 | 2 | 4 | 8
    diskRotation: number
    armRotation: {
        degrees: number
        time: number
    }
    queue: (ReadPayload | WritePayload)[]
    currentlyServicing?: CurrentlyServicingPayload
    sectors: {
        data: string
    }[]
}

const initialState: DiskState = {
    rotationTimeInSeconds: 6,
    diskRotation: 0,
    trackCount: 4,
    armRotation: {
        degrees: 0,
        time: 0,
    },
    state: "idle",
    queue: [],
    sectors: [],
}

export const diskSlice = createSlice({
    name: "disk",
    initialState,
    reducers: {
        setDiskState: (
            state,
            action: PayloadAction<"read" | "write" | "idle" | "seek">,
        ) => {
            const { payload } = action
            state.state = payload
            if (state.state === "idle") {
                state.armRotation = {
                    degrees: 70,
                    time: (3 / 55) * Math.abs(state.armRotation.degrees - 70),
                }
            }
        },
        enqueue: (state, action: PayloadAction<ReadPayload | WritePayload>) => {
            state.queue.push(action.payload)
        },
        dequeue: (state, action: PayloadAction<number>) => {
            state.queue.splice(action.payload, 1)
        },
        setCurrentlyServicing: (
            state,
            action: PayloadAction<CurrentlyServicingPayload>,
        ) => {
            state.currentlyServicing = action.payload
        },
        writeDataToSector: (
            state,
            action: PayloadAction<{ sector: number; data: string }>,
        ) => {
            const { sector, data } = action.payload
            state.sectors[sector].data = data
        },
        setTrackCount: (state, action: PayloadAction<1 | 2 | 4 | 8>) => {
            state.trackCount = action.payload
        },
        setDiskRotation: (state, action: PayloadAction<number>) => {
            state.diskRotation = action.payload
        },
        setSectors: (state, action: PayloadAction<{ data: string }[]>) => {
            state.sectors = action.payload
        },
        setArmRotation: (
            state,
            action: PayloadAction<{ degrees: number; time: number }>,
        ) => {
            state.armRotation = action.payload
        },
        setRotationTimeInSeconds: (state, action: PayloadAction<number>) => {
            state.rotationTimeInSeconds = action.payload
        }
    },
})

/** Evil demon function 😅 */
const findSectorRotation = (sector: number, getState: () => RootState) => {
    const sectors = selectSectors(getState()).length
    const sectorsPerTrack = sectors / getState().disk.trackCount
    const sectorRotation = (sector % sectorsPerTrack) * (360 / sectorsPerTrack)
    const radiusOfDiskHead = 250
    const radiusOfTrack = getRadiusOfTrack(sector, getState)
    const cosTheta =
        (270 ** 2 + radiusOfTrack ** 2 - radiusOfDiskHead ** 2) /
        (2 * radiusOfDiskHead * radiusOfTrack)
    const offset = Math.acos(cosTheta) * (180 / Math.PI)
    const rotation = (sectorRotation + 180 - offset) % 360
    return rotation
}

const findTrackNumber = (sector: number, getState: () => RootState) => {
    const sectors = getState().disk.sectors.length
    const sectorsPerTrack = sectors / getState().disk.trackCount
    const trackNumber =
        getState().disk.trackCount - Math.floor(sector / sectorsPerTrack) - 1
    return trackNumber
}

const writeDataToSector =
    (data: ReadPayload | WritePayload) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        const difference = () => {
            const necessaryRotation = findSectorRotation(
                data.sectorNumber,
                getState,
            )
            return Math.abs(getState().disk.diskRotation - necessaryRotation)
        }

        // While the arm is greater than 2 degrees away from the sector, don't do anything
        while (difference() > 5) {
            await new Promise((resolve) => setTimeout(() => resolve(true), 100)) // Wait 100ms and try again
        }

        // Only set the state to the action after when within the range of the appropriate rotation
        dispatch(setDiskState(data.type))

        while (difference() < 5) {
            await new Promise((resolve) => setTimeout(() => resolve(true), 100)) // wait for the arm to move away from the sector
        }
    }

export const getRadiusOfTrack = (sector: number, getState: () => RootState) => {
    const trackNumber = findTrackNumber(sector, getState)
    const trackCount = getState().disk.trackCount
    const trackSeparation = MAX_DISK_WIDTH_PERCENTAGE / (trackCount + 1)
    const radiusOfTrack =
        (((MAX_DISK_WIDTH_PERCENTAGE - trackSeparation * (trackNumber + 0.5)) /
            100) *
            500) /
        2
    return radiusOfTrack
}

const goToSector =
    (sector: number) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        const [x1, y1] = [0, -270] // origin of the disk read / write head
        const [x2, y2] = [0, 0] // origin of the disk
        const radiusOfTrack = getRadiusOfTrack(sector, getState)
        const [r1, r2] = [250, radiusOfTrack] // the radii of the two circles
        const d = Math.abs(y1)
        const l = (r1 ** 2 - r2 ** 2 + d ** 2) / (2 * d)
        const h = Math.sqrt(r1 ** 2 - l ** 2)
        const horizontalOffset = (l / d) * (x2 - x1) - (h / d) * (y2 - y1) + x1
        const degrees = -Math.asin(horizontalOffset / r1) * (180 / Math.PI)
        const timeDifferential =
            (3 / 55) * Math.abs(getState().disk.armRotation.degrees - degrees)
        dispatch(setArmRotation({ degrees, time: timeDifferential }))
        await new Promise((resolve) =>
            setTimeout(() => {
                resolve(true)
            }, timeDifferential * 1000),
        )
    }

const processItem =
    (item: ReadPayload | WritePayload) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        dispatch(setDiskState("seek"))

        // move the arm into position
        await dispatch(goToSector(item.sectorNumber))

        // wait for the write head to be over the appropriate sector, and then write the data
        await dispatch(writeDataToSector(item))

        // When the read / write has happened, notify all subscribers that it has been serviced
        dispatch(
            setCurrentlyServicing({
                requestId: item.requestId,
                sectorNumber: item.sectorNumber,
                type: item.type,
                data:
                    item.type === "read"
                        ? getState().disk.sectors[item.sectorNumber].data
                        : undefined,
            }),
        )
        dispatch(dequeue(0))
    }

export const processQueue =
    () => async (dispatch: AppDispatch, getState: () => RootState) => {
        const isIdle = getState().disk.state === "idle"
        let diskQueue: (ReadPayload | WritePayload)[]
        if (isIdle) {
            while ((diskQueue = getState().disk.queue).length > 0) {
                const item = diskQueue[0]
                await dispatch(processItem(item))
            }
            dispatch(setDiskState("idle"))
        }
    }

export const {
    setDiskState,
    enqueue,
    dequeue,
    setCurrentlyServicing,
    setTrackCount,
    setDiskRotation,
    setSectors,
    setArmRotation,
    setRotationTimeInSeconds
} = diskSlice.actions

export const selectDisk = (state: RootState) => state.disk
export const selectDiskState = (state: RootState) => state.disk.state
export const selectDiskQueue = (state: RootState) => state.disk.queue
export const selectCurrentlyServicing = (state: RootState) =>
    state.disk.currentlyServicing
export const selectSectors = (state: RootState) => state.disk.sectors
export const selectTrackCount = (state: RootState) => state.disk.trackCount
export const selectDiskRotation = (state: RootState) => state.disk.diskRotation
export const selectArmRotation = (state: RootState) => state.disk.armRotation
export const selectRotationTimeInSeconds = (state: RootState) => state.disk.rotationTimeInSeconds

export default diskSlice.reducer

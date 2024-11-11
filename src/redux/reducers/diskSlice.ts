import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { AppDispatch, RootState } from "../../store"
import { MAX_DISK_WIDTH_PERCENTAGE } from "../../apps/common/constants"
import { selectSectorsPerBlock, selectTotalBlocks } from "./fileSystemSlice"
import DiskReadPayload from "../../apis/interfaces/disk/DiskReadPayload.interface"
import DiskWritePayload from "../../apis/interfaces/disk/DiskWritePayload.interface"
import CurrentlyServicingPayload from "../../apis/interfaces/disk/CurrentlyServicingPayload.interface"

export type DiskStateType = "read" | "write" | "idle" | "seek" | "waiting"

interface DiskState {
    state: DiskStateType
    isProcessing: boolean
    trackCount: number
    diskSpeed: number
    skipWaitTime: boolean
    armRotation: {
        degrees: number
        time: number
    }
    queue: (DiskReadPayload | DiskWritePayload)[]
    currentlyServicing: CurrentlyServicingPayload<"read" | "write">[]
    sectors: Uint8Array[]
}

const initialState: DiskState = {
    isProcessing: false,
    skipWaitTime: false,
    diskSpeed: 0.6,
    currentlyServicing: [],
    trackCount: 8,
    armRotation: {
        degrees: 0,
        time: 0,
    },
    state: "idle",
    queue: [],
    sectors: [...new Array(64)].map(() => new Uint8Array(512)) // 64 sectors with 4096 bits => 512 bytes
}

export const diskSlice = createSlice({
    name: "disk",
    initialState,
    reducers: {
        setDiskState: (state, action: PayloadAction<DiskStateType>) => {
            const { payload } = action
            state.state = payload
            if (state.state === "idle") {
                state.armRotation = {
                    degrees: 70,
                    time: (1 / 55) * Math.abs(state.armRotation.degrees - 70),
                }
            }
        },
        enqueue: (
            state,
            action: PayloadAction<DiskReadPayload | DiskWritePayload>,
        ) => {
            state.queue.push(action.payload)
        },
        dequeue: (state, action: PayloadAction<number>) => {
            state.queue.splice(action.payload, 1)
        },
        addToCurrentlyServicing: (
            state,
            action: PayloadAction<CurrentlyServicingPayload<"read" | "write">>,
        ) => {
            state.currentlyServicing.push(action.payload)
        },
        removeFromCurrentlyServicing: (
            state,
            action: PayloadAction<string>,
        ) => {
            state.currentlyServicing = state.currentlyServicing.filter(
                (item) => item.requestId !== action.payload,
            )
        },
        writeSector: (
            state,
            action: PayloadAction<{ sector: number; data: Uint8Array }>,
        ) => {
            const { sector, data } = action.payload
            state.sectors[sector] = data
        },
        setTrackCount: (state, action: PayloadAction<number>) => {
            state.trackCount = action.payload
        },
        setSectors: (state, action: PayloadAction<Uint8Array[]>) => {
            state.sectors = action.payload
        },
        setArmRotation: (
            state,
            action: PayloadAction<{ degrees: number; time: number }>,
        ) => {
            state.armRotation = action.payload
        },
        setIsProcessing: (state, action: PayloadAction<boolean>) => {
            state.isProcessing = action.payload
        },
        setDiskSpeed: (state, action: PayloadAction<number>) => {
            state.diskSpeed = action.payload
        },
        setSkipWaitTime: (state, action: PayloadAction<boolean>) => {
            state.skipWaitTime = action.payload
        },
    },
})

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

const getNextSectorOnTrack = (sector: number, getState: () => RootState) => {
    const state = getState()
    const totalSectors = selectTotalBlocks(state) * selectSectorsPerBlock(state)

    let nextSector = sector + 1
    if (nextSector === totalSectors) {
        nextSector = 0
    }

    return nextSector
}

const writeOrRead =
    (data: DiskReadPayload | DiskWritePayload) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        const differenceFromArm = (sector: number) => {
            const necessaryRotation = findSectorRotation(sector, getState)
            let rotation: string | null | number =
                localStorage.getItem("rotation")
            rotation = rotation !== null ? +rotation : 0
            return Math.abs(rotation - necessaryRotation)
        }

        // While the arm is away from the sector, don't do anything
        while (differenceFromArm(data.sectorNumber) >= 3) {
            if (selectSkipWaitTime(getState())) {
                // if the wait time changed in between the request and processing, break
                break
            }
            await new Promise((resolve) => {
                setTimeout(() => resolve(true))
            }) // Wait and try again
        }

        // Only set the state to the action after when within the range of the appropriate rotation
        dispatch(setDiskState(data.type))

        // Actually write or read the data to / from the sector
        if (data.type === "write") {
            dispatch(
                writeSector({ sector: data.sectorNumber, data: data.data }),
            )
        }

        while (
            differenceFromArm(
                getNextSectorOnTrack(data.sectorNumber, getState),
            ) >= 3
        ) {
            if (selectSkipWaitTime(getState())) {
                // if the wait time changed in between the request and processing, break
                break
            }
            await new Promise((resolve) => setTimeout(() => resolve(true))) // wait for the arm to move away from the sector
        }

        // When the read / write has happened, notify all subscribers that it has been serviced
        dispatch(
            addToCurrentlyServicing({
                requestId: data.requestId,
                sectorNumber: data.sectorNumber,
                type: data.type,
                data:
                    data.type === "read"
                        ? getState().disk.sectors[data.sectorNumber]
                        : undefined,
            }),
        )
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
            (1 / 55) * Math.abs(getState().disk.armRotation.degrees - degrees)
        dispatch(setArmRotation({ degrees, time: timeDifferential }))
        await new Promise((resolve) =>
            setTimeout(() => {
                resolve(true)
            }, timeDifferential * 1000),
        )
    }

const processItem =
    (item: DiskReadPayload | DiskWritePayload, getState: () => RootState) =>
    async (dispatch: AppDispatch) => {
        dispatch(setDiskState("seek"))

        // move the arm into position
        if (!selectSkipWaitTime(getState())) {
            await dispatch(goToSector(item.sectorNumber))
        }

        // wait for the write head to be over the appropriate sector, and then write the data
        await dispatch(writeOrRead(item))

        dispatch(dequeue(0))
    }

export const processQueue =
    () => async (dispatch: AppDispatch, getState: () => RootState) => {
        const idleOrWaiting =
            getState().disk.state === "idle" ||
            getState().disk.state === "waiting"
        const isProcessing = getState().disk.isProcessing
        let diskQueue: (DiskReadPayload | DiskWritePayload)[] = []
        if (idleOrWaiting && !isProcessing) {
            dispatch(setIsProcessing(true))
            while ((diskQueue = getState().disk.queue).length > 0) {
                const item = diskQueue[0]
                await dispatch(processItem(item, getState))
            }
            if (getState().disk.queue.length === 0) {
                dispatch(setIsProcessing(false))
                dispatch(setDiskState("waiting"))

                await new Promise((resolve) =>
                    // Wait a bit. If nothing else gets queued after 300 ms, it's probably reasonable to assume
                    // the disk is idle, so you don't have to worry about jumping.
                    setTimeout(
                        () => {
                            if (getState().disk.queue.length === 0) {
                                dispatch(setDiskState("idle"))
                                resolve(true)
                            }
                        },
                        selectSkipWaitTime(getState()) ? 0 : 300,
                    ),
                )
            }
        }
    }

export const {
    setDiskState,
    enqueue,
    dequeue,
    removeFromCurrentlyServicing,
    setTrackCount,
    setSectors,
    setArmRotation,
    writeSector,
    setIsProcessing,
    addToCurrentlyServicing,
    setDiskSpeed,
    setSkipWaitTime,
} = diskSlice.actions

export const selectDisk = (state: RootState) => state.disk
export const selectDiskState = (state: RootState) => state.disk.state
export const selectDiskQueue = (state: RootState) => state.disk.queue
export const selectCurrentlyServicing = (state: RootState) =>
    state.disk.currentlyServicing
export const selectSectors = (state: RootState) => state.disk.sectors
export const selectTrackCount = (state: RootState) => state.disk.trackCount
export const selectArmRotation = (state: RootState) => state.disk.armRotation
export const selectDiskSpeed = (state: RootState) => state.disk.diskSpeed
export const selectSkipWaitTime = (state: RootState) => state.disk.skipWaitTime

export default diskSlice.reducer

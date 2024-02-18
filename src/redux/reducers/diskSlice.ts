import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { AppDispatch, RootState } from "../../store"
import {
    CurrentlyServicingPayload,
    ReadPayload,
    WritePayload,
} from "../../apis/disk"

interface DiskState {
    state: "read" | "write" | "idle" | "seek"
    trackCount: 2 | 4 | 8
    diskRotation: number
    armRotation: {
        degrees: number
        time: number
    }
    queue: (ReadPayload | WritePayload)[]
    currentlyServicing: CurrentlyServicingPayload
    sectors: {
        data: string
    }[]
}

const existingState: string | null = localStorage?.getItem("disk")

const initialState: DiskState = existingState
    ? JSON.parse(existingState)
    : {
          isProcessing: false,
          diskRotation: 0,
          trackCount: 2,
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
        setTrackCount: (state, action: PayloadAction<2 | 4 | 8>) => {
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
    },
})

const findSectorRotation = (sector: number, getState: () => RootState) => {
    const sectors = getState().disk.sectors.length
    const sectorsPerTrack = sectors / getState().disk.trackCount
    const rotation = 360 / (sector % sectorsPerTrack)
    return rotation
}

const findTrackNumber = (sector: number, getState: () => RootState) => {
    const sectors = getState().disk.sectors.length
    const sectorsPerTrack = sectors / getState().disk.trackCount
    const trackNumber = getState().disk.trackCount - Math.floor(sector / sectorsPerTrack) - 1
    return trackNumber
}

const goToSector =
    (sector: number) =>
    async (dispatch: AppDispatch, getState: () => RootState) => {
        const trackNumber = findTrackNumber(sector, getState)
        const trackCount = getState().disk.trackCount
        const trackSeparation = 90 / trackCount
        const radiusOfTrack = (((90 - trackSeparation * trackNumber) / 100) * 500) / 2
        const [x1, y1] = [0, -270] // origin of the disk read / write head
        const [x2, y2] = [0, 0] // origin of the disk
        const [r1, r2] = [250, radiusOfTrack] // the radii of the two circles
        const d = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
        const l = (r1 ** 2 - r2 ** 2 + d ** 2) / (2 * d)
        const h = Math.sqrt(r1 ** 2 - l ** 2)
        const horizontalOffset = (l / d) * (x2 - x1) - (h / d) * (y2 - y1) + x1
        const degrees = -Math.asin(horizontalOffset / r1) * (180 / Math.PI) 
        const timeDifferential =
            (3 / 55) *
            Math.abs(getState().disk.armRotation.degrees - degrees)
        dispatch(
            setArmRotation({ degrees, time: timeDifferential }),
        )
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
        
        
        // begin moving the arm
        await dispatch(goToSector(item.sectorNumber))

        // Only set the state to the action after the arm has moved
        dispatch(setDiskState(item.type))

        // When the read / write has happened, notify all subscribers that it's being serviced
        dispatch(
            setCurrentlyServicing({
                requestId: item.requestId,
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

export default diskSlice.reducer

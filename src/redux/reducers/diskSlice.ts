import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { AppDispatch, RootState } from "../../store"
import {
    CurrentlyServicingPayload,
    ReadPayload,
    WritePayload,
} from "../../apis/disk"

interface DiskState {
    state: "read" | "write" | "idle"
    sectorSize: number
    queue: (ReadPayload | WritePayload)[]
    currentlyServicing: CurrentlyServicingPayload
    sectors: [
        {
            data: string
        },
    ]
}

const existingState: string | null = localStorage?.getItem("disk")

const initialState: DiskState = existingState
    ? JSON.parse(existingState)
    : {
          isProcessing: false,
          sectorSize: 512,
          state: "idle",
          queue: [],
          sectors: [...Array(512)].map(() => {
              return {
                  data: "",
              }
          }),
      }

export const diskSlice = createSlice({
    name: "disk",
    initialState,
    reducers: {
        setDiskState: (
            state,
            action: PayloadAction<"read" | "write" | "idle">,
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
        writeDataToSector: (state, action: PayloadAction<{ sector: number, data: string }>) => {
            const { sector, data } = action.payload
            state.sectors[sector].data = data
        }
    },
})

const processItem =
    (item: ReadPayload | WritePayload) => async (dispatch: AppDispatch, getState: () => RootState) => {
        dispatch(setDiskState(item.type))

        // Checking for the rotation, setting the arm, etc. 
        await new Promise((resolve) =>
            setTimeout(() => {
                resolve(true)
            }, 1000),
        )

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
            dispatch(setDiskState('idle'))
        }
    }

export const { setDiskState, enqueue, dequeue, setCurrentlyServicing } =
    diskSlice.actions

export const selectDisk = (state: RootState) => state.disk
export const selectSectorSize = (state: RootState) => state.disk.sectorSize
export const selectDiskState = (state: RootState) => state.disk.state
export const selectDiskQueue = (state: RootState) => state.disk.queue
export const selectCurrentlyServicing = (state: RootState) =>
    state.disk.currentlyServicing

export default diskSlice.reducer

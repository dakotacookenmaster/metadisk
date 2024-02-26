import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { RootState } from "../../store"

interface Error {
    name: string
    message: string
}

interface AppState {
    error: Error | undefined
}

const initialState: AppState = {
    error: undefined
}

export const diskSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        setError: (state, action: PayloadAction<Error | undefined>) => {
            state.error = action.payload
        },
        clearError: (state) => {
            state.error = undefined
        }
    },
})

export const {
    setError,
    clearError,
} = diskSlice.actions

export const selectError = (state: RootState) => state.app.error

export default diskSlice.reducer

import { configureStore } from "@reduxjs/toolkit"
import counterReducer from "./redux/reducers/counterSlice"
import fileSystemReducer from "./redux/reducers/fileSystemSlice"

export const store = configureStore({
    reducer: {
        counter: counterReducer,
        fileSystem: fileSystemReducer
    }
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

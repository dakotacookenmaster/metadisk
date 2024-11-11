import { configureStore } from "@reduxjs/toolkit"
import fileSystemReducer from "./redux/reducers/fileSystemSlice"
import diskReducer from "./redux/reducers/diskSlice"
import appReducer from "./redux/reducers/appSlice"

export const store = configureStore({
    reducer: {
        fileSystem: fileSystemReducer,
        disk: diskReducer,
        app: appReducer
    },
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware({
            serializableCheck: {
                ignoredPaths: ['disk.sectors', 'disk.currentlyServicing', 'disk.queue'],
                ignoredActionPaths: ['payload']
            }
        })
    }
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

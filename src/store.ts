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
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: [
                    'disk/writeSector',
                    'disk/enqueue',
                    'disk/addToCurrentlyServicing',
                    'disk/setSectors'
                ],
                // Ignore these paths in the state
                ignoredPaths: [
                    'disk.sectors',
                    'disk.queue',
                    'disk.currentlyServicing'
                ],
            },
        }),
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

import { createContext } from "react"

/**
 * The id of the registered app currently rendering this subtree, or `null`
 * for code rendered outside of any app (e.g. global dialogs in `App.tsx`).
 *
 * `MainWindow` wraps each enabled app's element in
 * `<AppContext.Provider value={app.id}>`, so any descendant component (or
 * any helper invoked synchronously from one) can call `useContext(AppContext)`
 * to discover which app it is running on behalf of.
 *
 * This is what powers the disk simulator's per-block app icons: the
 * `usePosix()` hook reads this value and forwards it through every disk
 * call, so each entry in the disk queue carries an `appId` identifying the
 * originating app.
 */
const AppContext = createContext<string | null>(null)

export default AppContext

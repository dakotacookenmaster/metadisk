import { OverridableComponent } from "@mui/material/OverridableComponent"
import DiskSimulator from "./apps/disk-simulator/DiskSimulator"
import VSFS from "./apps/vsfs/VSFS"
import { DiskSimulatorIcon } from "./apps/disk-simulator/DiskSimulator"
import { SvgIconTypeMap } from "@mui/material"
import { VSFSIcon } from "./apps/vsfs/components/VSFSIcon"
import { store } from "./store"
import { setSkipWaitTime } from "./redux/reducers/diskSlice"
import LineStyleIcon from '@mui/icons-material/LineStyle';
import Editor from "./apps/editor/Editor"
import FileExplorer from "./apps/file-explorer/FileExplorer"
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CacheStatistics from "./apps/cache-statistics/CacheStatistics"
import CacheStatisticsIcon from "./apps/cache-statistics/CacheStatisticsIcon"
import SettingsIcon from "@mui/icons-material/Settings"

/**
 * Stable, machine-readable id for each registered app. This is the value
 * that gets propagated through `AppContext` and stamped onto every disk
 * queue entry so the disk simulator can render the originating app's icon
 * under each block.
 *
 * Keep these in sync with the keys of the `apps` map below; the `id` on
 * each entry references one of these.
 */
export const APP_IDS = {
    vsfs: "vsfs",
    diskSimulator: "disk-simulator",
    fileExplorer: "file-explorer",
    editor: "editor",
    cacheStatistics: "cache-statistics",
} as const

export type AppId = (typeof APP_IDS)[keyof typeof APP_IDS]

type AppIcon =
    | (OverridableComponent<SvgIconTypeMap<object, "svg">> & {
          muiName: string
      })
    | ((props: object) => React.JSX.Element)

const apps: Record<
    string,
    {
        id: AppId
        elementFn: (props?: object) => React.JSX.Element
        props?: object
        muiIcon: AppIcon
        enabled: boolean
        onChange?: (enabled: boolean) => void
    }
> = {
    "File System Visualizer": {
        id: APP_IDS.vsfs,
        elementFn: VSFS,
        muiIcon: VSFSIcon,
        enabled: true,
    },
    "Disk Simulator": {
        id: APP_IDS.diskSimulator,
        elementFn: DiskSimulator,
        muiIcon: DiskSimulatorIcon,
        enabled: true,
        onChange: (enabled: boolean) => {
            store.dispatch(setSkipWaitTime(!enabled))
        }
    },
    "File Explorer": {
        id: APP_IDS.fileExplorer,
        elementFn: FileExplorer,
        muiIcon: FolderOpenIcon,
        enabled: true,
    },
    "Text Editor": {
        id: APP_IDS.editor,
        elementFn: Editor,
        muiIcon: LineStyleIcon,
        enabled: true,
    },
    "Cache Statistics": {
        id: APP_IDS.cacheStatistics,
        elementFn: CacheStatistics,
        muiIcon: CacheStatisticsIcon,
        enabled: true,
    },
}

/**
 * Look up the registered icon for an app id (the value stamped onto disk
 * queue payloads). Returns a generic settings icon for `undefined` /
 * unrecognized ids so system-internal disk requests still render something.
 */
export const getAppIcon = (appId: string | undefined): AppIcon => {
    if (appId !== undefined) {
        for (const key of Object.keys(apps)) {
            if (apps[key].id === appId) {
                return apps[key].muiIcon
            }
        }
    }
    return SettingsIcon
}

/**
 * Look up the human-readable display name for an app id (the value
 * stamped onto disk queue payloads). The display name is the key the app
 * is registered under in the `apps` map above (e.g. "File Explorer").
 * Returns "System" for `undefined` / unrecognized ids so system-internal
 * disk requests still get a sensible label in the disk simulator tooltip.
 */
export const getAppName = (appId: string | undefined): string => {
    if (appId !== undefined) {
        for (const key of Object.keys(apps)) {
            if (apps[key].id === appId) {
                return key
            }
        }
    }
    return "System"
}

export default apps

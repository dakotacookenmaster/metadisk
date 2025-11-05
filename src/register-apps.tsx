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
import ExploreIcon from '@mui/icons-material/Explore';
import CacheStatistics from "./apps/cache-statistics/CacheStatistics"
import CacheStatisticsIcon from "./apps/cache-statistics/CacheStatisticsIcon"

const apps: Record<
    string,
    {
        elementFn: (props?: object) => React.JSX.Element
        props?: object
        muiIcon:
            | (OverridableComponent<SvgIconTypeMap<object, "svg">> & {
                  muiName: string
              })
            | ((props: object) => React.JSX.Element)
        enabled: boolean
        onChange?: (enabled: boolean) => void
    }
> = {
    "File System Visualizer": {
        elementFn: VSFS,
        muiIcon: VSFSIcon,
        enabled: true,
    },
    "Disk Simulator": {
        elementFn: DiskSimulator,
        muiIcon: DiskSimulatorIcon,
        enabled: true,
        onChange: (enabled: boolean) => {
            store.dispatch(setSkipWaitTime(!enabled))
        }
    },
    "File Explorer": {
        elementFn: FileExplorer,
        muiIcon: ExploreIcon,
        enabled: true,
    },
    "Text Editor": {
        elementFn: Editor,
        muiIcon: LineStyleIcon,
        enabled: true,
    },
    "Cache Statistics": {
        elementFn: CacheStatistics,
        muiIcon: CacheStatisticsIcon,
        enabled: true,
    },
}

export default apps

import { OverridableComponent } from "@mui/material/OverridableComponent"
import DiskSimulator from "./apps/disk-simulator/DiskSimulator"
import VSFS from "./apps/vsfs/VSFS"
import { DiskSimulatorIcon } from "./apps/disk-simulator/DiskSimulator"
import { SvgIconTypeMap } from "@mui/material"
import { VSFSIcon } from "./apps/vsfs/components/VSFSIcon"
import ExploreIcon from '@mui/icons-material/Explore'
import FileExplorer from "./apps/file-explorer/FileExplorer"
import { store } from "./store"
import { setSkipWaitTime } from "./redux/reducers/diskSlice"

const apps: Record<
    string,
    {
        elementFn: (props?: any) => React.JSX.Element
        props?: Record<string, any>
        muiIcon:
            | (OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
                  muiName: string
              })
            | ((props?: any) => React.JSX.Element)
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
}

export default apps

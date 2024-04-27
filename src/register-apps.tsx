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
    "Text Editor": {
        elementFn: Editor,
        muiIcon: LineStyleIcon,
        enabled: false,
    }
}

export default apps

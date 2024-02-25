import { OverridableComponent } from "@mui/material/OverridableComponent"
import DiskSimulator from "./apps/disk-simulator/DiskSimulator"
import VSFS from "./apps/vsfs/VSFS"
import { DiskSimulatorIcon } from "./apps/disk-simulator/DiskSimulator"
import { SvgIconTypeMap } from "@mui/material"
import { VSFSIcon } from "./apps/vsfs/components/VSFSIcon"
import ExploreIcon from '@mui/icons-material/Explore'
import FileExplorer from "./apps/file-explorer/FileExplorer"

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
    }
> = {
    "File System Visualizer": {
        elementFn: VSFS,
        muiIcon: VSFSIcon,
        enabled: true, // disabling this will prevent the app from running
    },
    "Disk Simulator": {
        elementFn: DiskSimulator,
        muiIcon: DiskSimulatorIcon,
        enabled: true, // disabling this will prevent the app from running
    },
    "File Explorer": {
        elementFn: FileExplorer,
        muiIcon: ExploreIcon,
        enabled: true,
    }
}

export default apps

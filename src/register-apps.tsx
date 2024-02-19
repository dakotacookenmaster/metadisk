import { OverridableComponent } from "@mui/material/OverridableComponent"
import DiskSimulator from "./apps/disk-simulator/DiskSimulator"
import VSFS from "./apps/vsfs/VSFS"
import { DiskSimulatorIcon } from "./apps/disk-simulator/DiskSimulator"
import { SvgIconTypeMap } from "@mui/material"
import { VSFSIcon } from "./apps/vsfs/components/VSFSIcon"

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
        enabled: true,
    },
    "Disk Simulator": {
        elementFn: DiskSimulator,
        muiIcon: DiskSimulatorIcon,
        enabled: true,
    },
}

export default apps

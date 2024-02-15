import MuiTooltip from "@mui/material/Tooltip"
import { TooltipProps } from "@mui/material/Tooltip"

export default function Tooltip(props: TooltipProps) {
    const { children } = props
    return (
        <MuiTooltip {...props} arrow>
            { children }
        </MuiTooltip>
    )
}

import { SvgIcon, SvgIconProps } from "@mui/material"

export default function CacheStatisticsIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M5 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5zm0 2h14v14H5V5zm2 2v2h10V7H7zm0 4v2h10v-2H7zm0 4v2h6v-2H7z" />
            <circle cx="16" cy="12" r="2" fill="currentColor" />
        </SvgIcon>
    )
}
import * as React from "react"
import { styled, useTheme, Theme, CSSObject } from "@mui/material/styles"
import Box from "@mui/material/Box"
import MuiDrawer from "@mui/material/Drawer"
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar"
import List from "@mui/material/List"
import CssBaseline from "@mui/material/CssBaseline"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import BugReportIcon from '@mui/icons-material/BugReport';
import ListItemText from "@mui/material/ListItemText"
import apps from "../../../register-apps"
import Tooltip from "./Tooltip"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import { VERSION } from "../constants"
import { useMediaQuery } from "@mui/material"

const drawerWidth = 300

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
})

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(8)} + 1px)`,
})

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}))

interface AppBarProps extends MuiAppBarProps {
    open?: boolean
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}))

const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
    }),
}))

export default function MainWindow(props: {
    apps: typeof apps
    setApps: React.Dispatch<React.SetStateAction<typeof apps>>
}) {
    const theme = useTheme()
    const { apps, setApps } = props
    const isLG = useMediaQuery(theme.breakpoints.down("xl"))

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <AppBar position="fixed" open={true}></AppBar>
            <Drawer variant="permanent" open={true}>
                <DrawerHeader>
                    <Typography
                        sx={{ paddingLeft: theme.spacing(2), width: "100%" }}
                        variant="h6"
                        noWrap
                        component="div"
                    >
                        Metadisk
                    </Typography>
                </DrawerHeader>
                <Divider />
                <List disablePadding>
                    {Object.keys(apps).map((appKey) => {
                        const { enabled } = apps[appKey]
                        const MuiIcon = apps[appKey].muiIcon
                        return (
                            <Tooltip
                                key={`side-menu-${appKey}`}
                                title={appKey}
                                placement="right"
                            >
                                <ListItem
                                    key={appKey}
                                    disablePadding
                                    sx={{
                                        display: "block",
                                    }}
                                >
                                    <ListItemButton
                                        onClick={() => {
                                            setApps((prevApps) => {
                                                if (prevApps[appKey].onChange) {
                                                    prevApps[appKey].onChange!(
                                                        !prevApps[appKey]
                                                            .enabled,
                                                    )
                                                }

                                                return {
                                                    ...prevApps,
                                                    [appKey]: {
                                                        ...prevApps[appKey],
                                                        enabled:
                                                            !prevApps[appKey]
                                                                .enabled,
                                                    },
                                                }
                                            })
                                        }}
                                        sx={{
                                            minHeight: 48,
                                            px: 2.5,
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: 3,
                                                color: "white",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <MuiIcon fontSize="large" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={appKey}
                                            sx={{
                                                color: "white",
                                            }}
                                        />
                                        {!enabled && (
                                            <VisibilityOffIcon
                                                sx={{
                                                    color: theme.palette.error
                                                        .dark,
                                                }}
                                            />
                                        )}
                                    </ListItemButton>
                                </ListItem>
                            </Tooltip>
                        )
                    })}
                </List>
                <Divider />
                <List
                    disablePadding
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        justifyContent: "flex-end",
                    }}
                >
                    <Tooltip title="Submit an Issue" placement="right">
                        <ListItem
                            disablePadding
                            sx={{
                                display: "block",
                            }}
                        >
                            <ListItemButton
                                href={"https://github.com/dakotacookenmaster/metadisk/issues"}
                                target="_blank"
                                sx={{
                                    minHeight: 48,
                                    px: 2.5,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: 3,
                                        color: "white",
                                        justifyContent: "center",
                                    }}
                                >
                                    <BugReportIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={"Submit an Issue"}
                                    sx={{
                                        color: "white",
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    </Tooltip>
                    <ListItem
                        disablePadding
                        sx={{
                            background: theme.palette.primary.main,
                            display: "block",
                        }}
                    >
                        <ListItemText
                            disableTypography
                            sx={{
                                color: "white",
                                textAlign: "center",
                                padding: theme.spacing(1),
                                fontSize: "12px",
                                fontWeight: "bold",
                            }}
                        >
                            Designed by Dakota Cookenmaster
                            <br />
                            Metadisk &copy; {new Date().getFullYear()} | Version{" "}
                            {VERSION}
                        </ListItemText>
                    </ListItem>
                </List>
            </Drawer>
            <Box component="main" sx={{ minWidth: 0, flexGrow: 1, p: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: theme.spacing(1.5),
                    }}
                >
                    {Object.keys(apps)
                        .map((appKey) => {
                            const Element = apps[appKey].elementFn
                            return (
                                <Box
                                    key={appKey}
                                    sx={{
                                        width: `calc(${
                                            isLG ? "100%" : "50%"
                                        } - (${theme.spacing(1.5)} / 2))`,
                                        height: "690px",
                                        display: apps[appKey].enabled
                                            ? "block"
                                            : "none",
                                    }}
                                >
                                    <Element {...apps[appKey].props} />
                                </Box>
                            )
                        })}
                </Box>
            </Box>
        </Box>
    )
}

import * as React from "react"
import { styled, useTheme, Theme, CSSObject } from "@mui/material/styles"
import Box from "@mui/material/Box"
import MuiDrawer from "@mui/material/Drawer"
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import List from "@mui/material/List"
import CssBaseline from "@mui/material/CssBaseline"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications"
import ListItemText from "@mui/material/ListItemText"
import apps from "../register-apps"
import Tooltip from "../apps/common/components/Tooltip"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import { VERSION } from "../apps/common/constants"
import { blue } from "@mui/material/colors"

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
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
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

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <AppBar position="fixed" open={true}>
                <Toolbar />
            </AppBar>
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
                                        onClick={() =>
                                            setApps((prevApps) => {
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
                                        }
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
                    <Tooltip title="Settings" placement="right">
                        <ListItem
                            disablePadding
                            sx={{
                                display: "block",
                            }}
                        >
                            <ListItemButton
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
                                    <SettingsApplicationsIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={"Settings"}
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
                            background: blue[600],
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
                            &copy; {new Date().getFullYear()} | Version{" "}
                            {VERSION}
                        </ListItemText>
                    </ListItem>
                </List>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <DrawerHeader />
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: theme.spacing(1.5),
                    }}
                >
                    {Object.keys(apps)
                        .filter((appKey) => apps[appKey].enabled)
                        .map((appKey) => {
                            const Element = apps[appKey].elementFn
                            return (
                                <Box
                                    key={appKey}
                                    sx={{
                                        width: `calc(50% - (${theme.spacing(
                                            1.5,
                                        )} / 2))`,
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

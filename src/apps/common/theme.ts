import { createTheme } from "@mui/material";
import { blue, green } from "@mui/material/colors";

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: blue[600]
        },
        success: {
            main: green[800],
        }
    },
    components: {
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: blue[600],
                    opacity: 1,
                    fontSize: "14px",
                    textAlign: "center",
                    padding: "10px",
                },
                arrow: {
                    color: blue[600],
                    opacity: 1,
                }
            }
        }
    }
})

export default theme
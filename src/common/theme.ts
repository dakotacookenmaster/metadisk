import { createTheme } from "@mui/material";
import { blue } from "@mui/material/colors";

const theme = createTheme({
    palette: {
        mode: "dark",
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
/* c8 ignore start */
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./App.css"
import { Provider as ReduxProvider } from "react-redux"
import { store } from "./store.ts"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import { ThemeProvider } from "@mui/material"
import theme from "./apps/common/theme.ts"

ReactDOM.createRoot(document.getElementById("root")!).render(
    <ReduxProvider store={store}>
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    </ReduxProvider>,
)
/* c8 ignore stop */

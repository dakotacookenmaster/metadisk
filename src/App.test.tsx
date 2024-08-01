import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import App from "./App"
import { ThemeProvider } from "@mui/material"
import theme from "./apps/common/theme"
import { Provider } from "react-redux"
import { store } from "./store"

afterEach(cleanup)

describe("renders the app", () => {
    beforeEach(() => {
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <App />
                </ThemeProvider>
            </Provider>,
        )
    })

    test("finds the appropriate text", () => {
        expect(screen.getByText("File System Visualizer")).toBeInTheDocument()
        expect(screen.getByText("Disk Simulator")).toBeInTheDocument()

        expect(screen.getAllByText("File Explorer")).toHaveLength(2)
        expect(screen.getAllByText("Text Editor")).toHaveLength(2)
    })
    test("clicking on the disk simulator will disable the component", async () => {
        const sim = screen.getByText("Disk Simulator")
        fireEvent.click(sim)
        const component = screen.getByTestId("Disk Simulator")
        expect(component).toHaveStyle({ display: "none" })
    })
})

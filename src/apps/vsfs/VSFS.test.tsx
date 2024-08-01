import { ThemeProvider } from "@mui/material"
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react"
import { Provider } from "react-redux"
import { describe, test, expect, beforeEach, afterEach } from "vitest"
import theme from "../common/theme"
import { store } from "../../store"
import {
    setIsAwaitingDisk,
    setIsFinishedConfiguringFileSystem,
} from "../../redux/reducers/fileSystemSlice"
import App from "../../App"

describe("renders the VSFS component", () => {
    // override scrollIntoView for this test, since it's not implemented in jsdom
    window.HTMLElement.prototype.scrollIntoView = function () {}
    beforeEach(async () => {
        render(
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <App />
                </ThemeProvider>
            </Provider>,
        )

        store.dispatch(setIsAwaitingDisk(false))
        store.dispatch(setIsFinishedConfiguringFileSystem(true))

        // find the disk simulator and disable it
        const simButton = await screen.findByText(/Disk Simulator/i, {
            selector: "span",
        })
        fireEvent.click(simButton)

        const alertButton = screen.queryByTestId("Close Alert")
        if (alertButton) {
            alertButton.click()
        }
    })
    afterEach(cleanup)

    test("finds the File System Block View", { timeout: 10000 }, async () => {
        await waitFor(() => expect(screen.getByText(/File System Block Layout/i)).toBeInTheDocument(), { timeout: 5000 })
        const button = screen.getByText(/inode bitmap/i)
        fireEvent.click(button)

        await waitFor(() => expect(screen.getByText(/binary/i)).toBeInTheDocument(), { timeout: 5000 })
        const binaryBtn = screen.getByText(/binary/i)
        fireEvent.click(binaryBtn)

        await waitFor(() => expect(screen.getByText(/hex/i)).toBeInTheDocument(), { timeout: 5000 })
        const hexBtn = screen.getByText(/hex/i)
        fireEvent.click(hexBtn)

        await waitFor(() => expect(screen.getByText(/ascii/i)).toBeInTheDocument(), { timeout: 5000 })
        const asciiBtn = screen.getByText(/ascii/i)
        fireEvent.click(asciiBtn)

        await waitFor(() => expect(screen.getByText(/inode block 0/i)).toBeInTheDocument(), { timeout: 5000 })
        const nextButton = screen.getByText(/inode block 0/i)
        fireEvent.click(nextButton)
    })
})

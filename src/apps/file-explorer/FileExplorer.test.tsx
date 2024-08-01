import { ThemeProvider } from "@mui/material"
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    waitForElementToBeRemoved,
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

describe("renders the File Explorer", () => {
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

    test("finds the File Explorer", async () => {
        const text = screen.getByText(/File Explorer/i, { selector: "h5" })
        expect(text).toBeInTheDocument()
        expect(screen.queryByText(/Loading File Explorer/i)).toBeInTheDocument()
        await waitForElementToBeRemoved(
            screen.getByText(/Loading File Explorer/i),
        )
        expect(
            screen.queryByText(/Loading File Explorer/i),
        ).not.toBeInTheDocument()
    })

    test(
        "opens a new dialog for creating a file",
        { timeout: 30000 },
        async () => {
            const button = screen.getByTestId("New File Button")
            await waitFor(() => expect(button).not.toBeDisabled(), {
                timeout: 5000,
            })
            fireEvent.click(button)
            const dialog = await screen.findByRole("dialog")
            const input = dialog.querySelector("input")
            expect(input).toBeInTheDocument()
            fireEvent.change(input!, { target: { value: "My New File" } })
            const ok = await screen.findByRole("button", { name: /create/i })
            fireEvent.click(ok)
            await waitFor(
                () =>
                    expect(screen.getByText(/My New .../i)).toBeInTheDocument(),
                {
                    timeout: 10000,
                },
            )
        },
    )

    test(
        "opens a new dialog for creating a directory",
        { timeout: 30000 },
        async () => {
            const button = screen.getByTestId("New Directory Button")
            await waitFor(() => expect(button).not.toBeDisabled(), {
                timeout: 5000,
            })
            fireEvent.click(button)
            const dialog = await screen.findByRole("dialog")
            const input = dialog.querySelector("input")
            expect(input).toBeInTheDocument()
            fireEvent.change(input!, { target: { value: "My New Directory" } })
            const ok = await screen.findByRole("button", { name: /create/i })
            fireEvent.click(ok)
            await waitFor(
                () =>
                    expect(screen.getByText(/My New .../i)).toBeInTheDocument(),
                {
                    timeout: 10000,
                },
            )
        },
    )
})

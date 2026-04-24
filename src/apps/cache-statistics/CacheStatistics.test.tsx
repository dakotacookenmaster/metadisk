import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { store } from "../../store"
import CacheStatistics from "./CacheStatistics"
import {
    selectCacheEnabled,
    setCacheEnabled,
} from "../../redux/reducers/diskSlice"

const renderApp = () =>
    render(
        <Provider store={store}>
            <CacheStatistics />
        </Provider>,
    )

beforeEach(() => {
    // Always start each test with the cache enabled.
    store.dispatch(setCacheEnabled(true))
})

afterEach(() => {
    cleanup()
    store.dispatch(setCacheEnabled(true))
})

describe("CacheStatistics in-app cache toggle", () => {
    test("renders a Disable button when the cache is enabled", () => {
        renderApp()
        expect(screen.getByText("Block Cache Statistics")).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: /disable cache/i }),
        ).toBeInTheDocument()
    })

    test("clicking Disable dispatches setCacheEnabled(false)", () => {
        renderApp()
        expect(selectCacheEnabled(store.getState())).toBe(true)

        fireEvent.click(
            screen.getByRole("button", { name: /disable cache/i }),
        )

        expect(selectCacheEnabled(store.getState())).toBe(false)
    })

    test("disabling the cache replaces the stats view with the disabled view", () => {
        renderApp()
        fireEvent.click(
            screen.getByRole("button", { name: /disable cache/i }),
        )

        expect(screen.getByText("Cache Disabled")).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: /enable cache/i }),
        ).toBeInTheDocument()
    })

    test("the Enable button in the disabled view re-enables the cache", () => {
        // Start in the disabled state.
        store.dispatch(setCacheEnabled(false))
        renderApp()

        expect(screen.getByText("Cache Disabled")).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole("button", { name: /enable cache/i }),
        )

        expect(selectCacheEnabled(store.getState())).toBe(true)
    })

    test("toggling Disable then Enable from the app round-trips back to the stats view", () => {
        renderApp()

        fireEvent.click(
            screen.getByRole("button", { name: /disable cache/i }),
        )
        expect(selectCacheEnabled(store.getState())).toBe(false)

        fireEvent.click(
            screen.getByRole("button", { name: /enable cache/i }),
        )
        expect(selectCacheEnabled(store.getState())).toBe(true)

        // Stats view is back, complete with its Disable button.
        expect(
            screen.getByRole("button", { name: /disable cache/i }),
        ).toBeInTheDocument()
    })
})

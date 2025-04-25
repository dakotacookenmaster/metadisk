import { describe, test, expect, afterEach } from "vitest"
import { render, cleanup, screen } from "@testing-library/react"
import Bitmap from "./Bitmap"
import { Provider } from "react-redux"
import { store } from "../../../store"
import { ThemeProvider } from "@mui/material"
import theme from "../../common/theme"

afterEach(cleanup)

describe("it should render the appropriate number of pages of boxes, each appropriately numbered and colored", () => {
    test("256 or less should render on a single page", async () => {
        const { queryByTestId } = render(
            <Provider store={store}>
                <Bitmap setSelected={() => {}} setSelectedInode={() => {}} setBlockNumber={() => {}} data="0000" type="inode" />
            </Provider>,
        )
        // Expect 4 bitmap boxes to appear
        for (let i = 0; i < 3; i++) {
            const box = queryByTestId(`bit-${i}`)
            expect(box).toBeInTheDocument()
        }

        // There shouldn't be a fifth
        const box = queryByTestId(`bit-4`)
        expect(box).not.toBeInTheDocument()
    })
    test(
        "10000 should render on multiple pages and change the font size",
        { timeout: 60000 },
        async () => {
            render(
                <Provider store={store}>
                    <ThemeProvider theme={theme}>
                        <Bitmap setSelected={() => {}} setSelectedInode={() => {}} setBlockNumber={() => {}} data={"1" + "0".repeat(10000)} type="data" />
                    </ThemeProvider>
                </Provider>,
            )
            // Expect 4 bitmap boxes to appear

            for (let i = 0; i < 40; i++) {
                if (i === 0) {
                    const box1 = await screen.findByTestId(`bit-0`)
                    expect(box1).toBeInTheDocument()
                    expect(box1).toHaveStyle({
                        background: theme.palette.error.main,
                    })

                    const box2 = await screen.findByTestId(`bit-1`)
                    expect(box2).toBeInTheDocument()
                    expect(box2).toHaveStyle({
                        background: theme.palette.success.main,
                    })
                } else {
                }

                const nextButton = await screen.findByTestId("next")
                expect(nextButton).toBeInTheDocument()
                nextButton?.click()
            }
        },
    )
})

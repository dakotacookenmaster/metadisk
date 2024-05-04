import { describe, test, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Bitmap from "./Bitmap"
import { Provider } from "react-redux"
import { store } from "../../../store"

describe("it should render the appropriate number of pages of boxes, each appropriately numbered and colored", () => { 
    test("256 or less should render on a single page", async () => {
        render(<Provider store={store}><Bitmap data="0000" type="inode"/></Provider>)
        // Expect 4 bitmap boxes to appear
        for(let i = 0; i < 3; i++) {
            const box = screen.queryByTestId(`bit-${i}`)
            expect(box).toBeInTheDocument()
        }

        // There shouldn't be a fifth
        const box = screen.queryByTestId(`bit-4`)
        expect(box).not.toBeInTheDocument()
    })
})
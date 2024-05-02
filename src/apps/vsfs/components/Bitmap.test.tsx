import { describe, test } from "vitest"
import { render } from "@testing-library/react"
import Bitmap from "./Bitmap"

describe("it should render the appropriate number of pages of boxes, each appropriately numbered and colored", () => { 
    test("256 or less should render on a single page", () => {
        render(<Bitmap data="0000" type="inode"/>)
    })
})
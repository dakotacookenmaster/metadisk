import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
} from "vitest"
import { store } from "../../store"
import Editor from "./Editor"
import { setSkipWaitTime } from "../../redux/reducers/diskSlice"
import initializeSuperblock from "../../apis/vsfs/system/InitializeSuperblock.vsfs"
import open from "../../apis/vsfs/posix/open.vsfs"
import OpenFlags from "../../apis/enums/vsfs/OpenFlags.enum"
import Permissions from "../../apis/enums/vsfs/Permissions.enum"
import close from "../../apis/vsfs/posix/close.vsfs"
import { setOpenFile } from "../../redux/reducers/fileSystemSlice"
import write from "../../apis/vsfs/posix/write.vsfs"
import convertTextToBinaryString from "../common/helpers/convertTextToBinaryString"

afterEach(cleanup)

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    await initializeSuperblock(() => {})
})

describe("renders the disk simulator", () => {
    beforeEach(async () => {
        render(
            <Provider store={store}>
                <Editor />
            </Provider>,
        )
    })

    test("finds the appropriate text on initial render", () => {
        const title = screen.getByText("No File Selected")
        expect(title).toBeInTheDocument()
    })

    test("views the text in an open file, saves an update, and closes the file", async () => {
        // override scrollIntoView for this test, since it's not implemented in jsdom
        window.HTMLElement.prototype.scrollIntoView = function () {}

        // create the file and then close it
        const fd = await open(
            "/abc",
            [OpenFlags.O_CREAT, OpenFlags.O_RDONLY],
            Permissions.READ_WRITE,
        )

        // Write some content to the file
        await write(fd, convertTextToBinaryString("Hi there, what's going on?"))

        // close the file
        close(fd)

        // set the open file for the editor
        store.dispatch(setOpenFile("/abc"))

        // expect that text to appear in the editor
        const text = await screen.findByText("Hi there, what's going on?")
        expect(text).toBeInTheDocument()

        // try to change the text, including newlines and non CP-437 text
        fireEvent.change(text, { target: { value: "New text\n😃" } })
        expect(text.innerHTML).toBe("New text\n?")

        // save the file
        const saveButton = screen.getByText("Save")
        fireEvent.click(saveButton)

        // make sure the button changed to save
        await expect(screen.findByText("Saved!")).resolves.toBeInTheDocument()

        // close the file
        const closeButton = screen.getByRole("button", { name: "Close" })
        fireEvent.click(closeButton)

        // expect to see text again
        const newText = await screen.findByText("No File Selected")
        expect(newText).toBeInTheDocument()
    })
})

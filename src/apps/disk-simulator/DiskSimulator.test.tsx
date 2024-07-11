import { cleanup, render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { store } from "../../store"
import DiskSimulator from "./DiskSimulator"
import {
    setIsAwaitingDisk,
    setIsFinishedConfiguringFileSystem,
} from "../../redux/reducers/fileSystemSlice"
import { dequeue, enqueue } from "../../redux/reducers/diskSlice"
import DiskReadPayload from "../../apis/interfaces/disk/DiskReadPayload.interface"
import { v4 as uuid } from "uuid"

afterEach(cleanup)

describe("renders the disk simulator", () => {
    beforeEach(async () => {
        render(
            <Provider store={store}>
                <DiskSimulator />
            </Provider>,
        )

        store.dispatch(setIsAwaitingDisk(false))
        store.dispatch(setIsFinishedConfiguringFileSystem(true))
    })

    test("finds the appropriate text", () => {
        const title = screen.getByText("Disk Simulator")
        expect(title).toBeInTheDocument()

        const queueText = screen.getByText("Disk Queue:")
        expect(queueText).toBeInTheDocument()
    })

    test("shows the items in a disk queue", async () => {
        const id = uuid()
        store.dispatch(enqueue({
            requestId: id,
            sectorNumber: 0,
            type: "read"
        } satisfies DiskReadPayload ))

        const item = await screen.findByText("0 (R)")
        expect(item).toBeInTheDocument()

        store.dispatch(dequeue(0))

        const end = await screen.findByText("N/A")
        expect(end).toBeInTheDocument()
    })
})

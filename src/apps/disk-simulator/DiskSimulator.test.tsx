import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
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
import DiskWritePayload from "../../apis/interfaces/disk/DiskWritePayload.interface"
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

    test("changing the speed to the next level should work", async () => {
        const slider = await screen.findByTestId("slider")
        const grabber = slider.querySelector("span:last-child input")
        expect(grabber).toBeInTheDocument()
        fireEvent.change(grabber!, { target: { value: 4 } })
        expect(grabber).toHaveValue("4")
        const text = await screen.findByText("Very Fast")
        expect(text).toBeInTheDocument()
    })

    test("queue items split into separate groups whenever the originating app changes, even on the same block", async () => {
        // The default file-system config in the test store uses
        // sectorsPerBlock=4, so sectors 0 and 1 share block 0 and sector
        // 4 belongs to block 1.
        //
        // - Sector 0 (R, file-explorer)  → group 0 (block 0, file-explorer)
        // - Sector 1 (W, editor)         → group 1 (block 0, editor)
        //                                  ↑ split: appId changed
        // - Sector 4 (R, editor)         → group 2 (block 1, editor)
        //                                  ↑ split: block changed
        store.dispatch(enqueue({
            requestId: uuid(),
            sectorNumber: 0,
            type: "read",
            appId: "file-explorer",
        } satisfies DiskReadPayload))
        store.dispatch(enqueue({
            requestId: uuid(),
            sectorNumber: 1,
            type: "write",
            data: new Uint8Array(0),
            appId: "editor",
        } satisfies DiskWritePayload))
        store.dispatch(enqueue({
            requestId: uuid(),
            sectorNumber: 4,
            type: "read",
            appId: "editor",
        } satisfies DiskReadPayload))

        expect(await screen.findByText("0 (R)")).toBeInTheDocument()
        expect(await screen.findByText("1 (W)")).toBeInTheDocument()
        expect(await screen.findByText("4 (R)")).toBeInTheDocument()

        // Three groups, each with exactly one icon.
        const groups = await screen.findAllByTestId(/^queue-group-\d+$/)
        expect(groups).toHaveLength(3)
        const icons = await screen.findAllByTestId(/^queue-group-icon-\d+$/)
        expect(icons).toHaveLength(3)

        // Cleanup so we don't leak state into other tests.
        store.dispatch(dequeue(0))
        store.dispatch(dequeue(0))
        store.dispatch(dequeue(0))
    })

    test("two block ops on the same block stay in separate groups via opId, even as items dequeue", async () => {
        // The default test store config is sectorsPerBlock=4. Simulate two
        // back-to-back `readBlock(0)` calls by enqueueing 8 sectors total,
        // where each set of 4 shares an `opId` (as `readBlock` would stamp
        // them). The result should be TWO groups of 4, NOT one group of 8 —
        // and crucially, the grouping should remain stable as items are
        // dequeued from the front, never causing the right-hand group to
        // "disappear" before the left-hand one drains.
        const opA = uuid()
        const opB = uuid()
        for (const opId of [opA, opB]) {
            for (let s = 0; s < 4; s++) {
                store.dispatch(enqueue({
                    requestId: uuid(),
                    sectorNumber: s,
                    type: "read",
                    appId: "vsfs",
                    opId,
                } satisfies DiskReadPayload))
            }
        }

        // Wait for the queue to render before counting groups.
        expect((await screen.findAllByText("0 (R)")).length).toBeGreaterThan(0)

        let groups = await screen.findAllByTestId(/^queue-group-\d+$/)
        expect(groups).toHaveLength(2)

        const icons = await screen.findAllByTestId(/^queue-group-icon-\d+$/)
        expect(icons).toHaveLength(2)

        // Regression check for the "disappearing right-hand group" bug:
        // dequeue items one at a time from the front. While items from
        // op A remain, there must always be exactly two groups (op A
        // shrinking, op B intact at 4). Once op A is fully drained,
        // exactly one group of 4 (op B) remains.
        for (let i = 0; i < 3; i++) {
            store.dispatch(dequeue(0))
            await waitFor(async () => {
                groups = await screen.findAllByTestId(/^queue-group-\d+$/)
                expect(groups).toHaveLength(2)
            })
        }
        store.dispatch(dequeue(0)) // drains the last item of op A
        await waitFor(async () => {
            groups = await screen.findAllByTestId(/^queue-group-\d+$/)
            expect(groups).toHaveLength(1)
        })

        for (let i = 0; i < 4; i++) {
            store.dispatch(dequeue(0))
        }
    })
})

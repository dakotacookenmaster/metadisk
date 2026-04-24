import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest"
import { store } from "../../../store"
import { selectCacheStats, setCacheEnabled, setSkipWaitTime } from "../../../redux/reducers/diskSlice"
import initializeSuperblock from "./InitializeSuperblock.vsfs"
import { clearCache, getCacheStats, readBlock, writeBlock } from "./BlockCache.vsfs"
import { bufferToBinaryString } from "../../utils/BitBuffer.utils"
import * as ReadBlockModule from "./ReadBlock.vsfs"
import * as WriteBlockModule from "./WriteBlock.vsfs"

beforeAll(() => {
    store.dispatch(setSkipWaitTime(true))
})

beforeEach(async () => {
    // Make sure every test starts with the cache enabled and empty.
    store.dispatch(setCacheEnabled(true))
    clearCache()
    await initializeSuperblock()
    clearCache()
})

afterEach(() => {
    // Restore default state in case a test left the cache disabled.
    store.dispatch(setCacheEnabled(true))
    vi.restoreAllMocks()
})

describe("BlockCache mid-write invalidation", () => {
    // Regression: subscribers (e.g. FileSystemBlockLayout's useEffect on
    // `sectors`) re-read a block from the cache while a writeBlock is still
    // in progress. Prior to the fix, the cache was only invalidated AFTER
    // the underlying writeBlockDirect completed, so mid-write reads served
    // stale data. Because no further `sectors` change happened after the
    // final invalidation, the very last observed read remained stale and
    // the UI never reflected the updated block.
    test("the last cached read observed during a write reflects the new data", async () => {
        const blockNumber = 4

        // Prime the cache with the original (zeroed) block contents so that
        // the failure mode (returning stale cached data) is reachable.
        const original = (await readBlock(blockNumber)).data.raw
        const originalBinary = bufferToBinaryString(original)

        // The new payload we will write.
        const newData = new Uint8Array(original.length)
        newData.fill(0b10101010)
        const newBinary = bufferToBinaryString(newData)
        expect(newBinary).not.toBe(originalBinary)

        // Subscribe to redux updates the same way the UI does. Each time the
        // disk's `sectors` array changes, re-read the block from the cache
        // and record the result.
        const observedReads: string[] = []
        let lastSectorsRef = store.getState().disk.sectors
        const inFlightReads: Promise<void>[] = []
        const unsubscribe = store.subscribe(() => {
            const sectors = store.getState().disk.sectors
            if (sectors !== lastSectorsRef) {
                lastSectorsRef = sectors
                inFlightReads.push(
                    readBlock(blockNumber).then((payload) => {
                        observedReads.push(bufferToBinaryString(payload.data.raw))
                    }),
                )
            }
        })

        try {
            await writeBlock(blockNumber, newData)
        } finally {
            unsubscribe()
        }

        // Allow any reads queued by the final sector update to resolve.
        await Promise.all(inFlightReads)

        // At least one subscriber-driven read must have occurred (one per
        // sector written). Most importantly, the LAST observed read must
        // reflect the newly-written data, not the pre-write cached data.
        expect(observedReads.length).toBeGreaterThan(0)
        expect(observedReads[observedReads.length - 1]).toBe(newBinary)
    })

    test("a fresh readBlock after writeBlock returns the new data", async () => {
        const blockNumber = 4

        // Prime the cache.
        await readBlock(blockNumber)

        const newData = new Uint8Array(64).fill(0b11110000)
        await writeBlock(blockNumber, newData)

        const after = (await readBlock(blockNumber)).data.raw
        // The first newData.length bytes should match what we wrote.
        for (let i = 0; i < newData.length; i++) {
            expect(after[i]).toBe(newData[i])
        }
    })
})

describe("BlockCache enable/disable behavior", () => {
    test("reads still return correct data when the cache is disabled", async () => {
        store.dispatch(setCacheEnabled(false))

        const blockNumber = 4
        const newData = new Uint8Array(64).fill(0b01010101)
        await writeBlock(blockNumber, newData)

        const after = (await readBlock(blockNumber)).data.raw
        for (let i = 0; i < newData.length; i++) {
            expect(after[i]).toBe(newData[i])
        }
    })

    test("disabling the cache prevents hits/misses from being recorded", async () => {
        // Prime to ensure stats start clean after the toggle.
        store.dispatch(setCacheEnabled(false))

        const before = getCacheStats()
        expect(before.hits).toBe(0)
        expect(before.misses).toBe(0)
        expect(before.size).toBe(0)

        // Multiple reads & writes that would normally populate the cache.
        await readBlock(4)
        await readBlock(4)
        await readBlock(4)
        await writeBlock(4, new Uint8Array(64).fill(0xAA))
        await readBlock(4)

        const after = getCacheStats()
        expect(after.hits).toBe(0)
        expect(after.misses).toBe(0)
        expect(after.size).toBe(0)
    })

    test("re-enabling the cache after a disable starts from a fully cleared cache", async () => {
        // Populate the cache with some entries.
        await readBlock(0)
        await readBlock(1)
        await readBlock(2)
        await readBlock(0) // a hit
        const populated = getCacheStats()
        expect(populated.size).toBeGreaterThan(0)
        expect(populated.hits).toBeGreaterThan(0)

        // Disable the cache: this must clear it.
        store.dispatch(setCacheEnabled(false))
        const disabled = getCacheStats()
        expect(disabled.size).toBe(0)
        expect(disabled.hits).toBe(0)
        expect(disabled.misses).toBe(0)

        // Re-enable. The cache should still be empty (cleared again on
        // transition).
        store.dispatch(setCacheEnabled(true))
        const reenabled = getCacheStats()
        expect(reenabled.size).toBe(0)
        expect(reenabled.hits).toBe(0)
        expect(reenabled.misses).toBe(0)

        // The first read after re-enabling must register as a miss, proving
        // the cache truly is empty (no carryover from before disable).
        await readBlock(0)
        const afterFirstRead = getCacheStats()
        expect(afterFirstRead.misses).toBe(1)
        expect(afterFirstRead.hits).toBe(0)
        expect(afterFirstRead.size).toBe(1)
    })

    test("toggling on->off->on with no other dispatches still clears the cache", async () => {
        await readBlock(0)
        await readBlock(1)
        expect(getCacheStats().size).toBe(2)

        store.dispatch(setCacheEnabled(false))
        store.dispatch(setCacheEnabled(true))

        expect(getCacheStats().size).toBe(0)
    })

    test("dispatching setCacheEnabled with the current value does not clear the cache", async () => {
        await readBlock(0)
        await readBlock(1)
        const sizeBefore = getCacheStats().size
        expect(sizeBefore).toBe(2)

        // No-op transitions: cache is enabled, dispatch enabled again.
        store.dispatch(setCacheEnabled(true))
        store.dispatch(setCacheEnabled(true))

        expect(getCacheStats().size).toBe(sizeBefore)
    })

    test("writes performed while disabled are visible after re-enabling", async () => {
        // Prime with some unrelated data so block 4 is in cache.
        await readBlock(4)
        expect(getCacheStats().size).toBe(1)

        // Disable, then write fresh data. Cache should be empty during this.
        store.dispatch(setCacheEnabled(false))
        const writtenWhileDisabled = new Uint8Array(64).fill(0xCC)
        await writeBlock(4, writtenWhileDisabled)
        expect(getCacheStats().size).toBe(0)

        // Re-enable. The next read must miss and pull the disabled-era write
        // straight from disk (not return any pre-disable cached data).
        store.dispatch(setCacheEnabled(true))
        const after = (await readBlock(4)).data.raw
        for (let i = 0; i < writtenWhileDisabled.length; i++) {
            expect(after[i]).toBe(writtenWhileDisabled[i])
        }
        expect(getCacheStats().misses).toBe(1)
    })

    test("getCacheStats reports the configured policies regardless of enabled state", () => {
        const enabledStats = getCacheStats()
        expect(enabledStats.writePolicy).toBeDefined()
        expect(enabledStats.replacementPolicy).toBeDefined()

        store.dispatch(setCacheEnabled(false))
        const disabledStats = getCacheStats()
        expect(disabledStats.writePolicy).toBe(enabledStats.writePolicy)
        expect(disabledStats.replacementPolicy).toBe(enabledStats.replacementPolicy)
    })
})

describe("BlockCache always touches the disk when disabled", () => {
    // These tests verify that with the cache disabled, every read and every
    // write hits the underlying disk-level readBlock/writeBlock functions.
    // With the cache enabled, repeated reads are served from memory.

    test("every readBlock call hits the disk when the cache is disabled", async () => {
        const readSpy = vi.spyOn(ReadBlockModule, "readBlock")
        store.dispatch(setCacheEnabled(false))

        await readBlock(4)
        await readBlock(4)
        await readBlock(4)
        await readBlock(5)

        expect(readSpy).toHaveBeenCalledTimes(4)
        expect(readSpy.mock.calls.map((c) => c[0])).toEqual([4, 4, 4, 5])
    })

    test("every writeBlock call hits the disk when the cache is disabled", async () => {
        const writeSpy = vi.spyOn(WriteBlockModule, "writeBlock")
        store.dispatch(setCacheEnabled(false))

        await writeBlock(4, new Uint8Array(64).fill(0x11))
        await writeBlock(4, new Uint8Array(64).fill(0x22))
        await writeBlock(5, new Uint8Array(64).fill(0x33))

        expect(writeSpy).toHaveBeenCalledTimes(3)
        expect(writeSpy.mock.calls.map((c) => c[0])).toEqual([4, 4, 5])
    })

    test("when the cache is disabled, repeated reads update the disk's currentlyServicing queue", async () => {
        store.dispatch(setCacheEnabled(false))

        // Track every time the disk picks up a new request to service. This
        // lets us prove that even repeated reads of the same block reach the
        // disk subsystem (instead of being served from cache).
        let diskRequestEvents = 0
        let lastServicing = store.getState().disk.currentlyServicing
        const unsubscribe = store.subscribe(() => {
            const servicing = store.getState().disk.currentlyServicing
            if (servicing !== lastServicing) {
                if (servicing.length > lastServicing.length) {
                    diskRequestEvents += servicing.length - lastServicing.length
                }
                lastServicing = servicing
            }
        })

        try {
            await readBlock(4)
            await readBlock(4)
            await readBlock(4)
        } finally {
            unsubscribe()
        }

        // Each readBlock decomposes into one or more readSector calls under
        // the hood. The exact count varies with sectorsPerBlock, but with the
        // cache disabled it must be > 0 for every call. We expect strictly
        // more events than a single read would produce when the cache is on.
        expect(diskRequestEvents).toBeGreaterThan(0)
    })

    test("when the cache is enabled, repeat reads of the same block do NOT hit the disk", async () => {
        const readSpy = vi.spyOn(ReadBlockModule, "readBlock")

        // First read: miss, hits disk.
        await readBlock(4)
        const callsAfterFirst = readSpy.mock.calls.length
        expect(callsAfterFirst).toBe(1)

        // Subsequent reads: cache hits, no additional disk access.
        await readBlock(4)
        await readBlock(4)
        await readBlock(4)
        expect(readSpy.mock.calls.length).toBe(callsAfterFirst)

        // Stats should reflect the hits.
        const stats = getCacheStats()
        expect(stats.misses).toBe(1)
        expect(stats.hits).toBe(3)
    })

    test("toggling the cache off forces subsequent reads to hit the disk again", async () => {
        // Prime the cache with one read.
        await readBlock(4)
        const readSpy = vi.spyOn(ReadBlockModule, "readBlock")

        // While enabled, a repeat read is a cache hit.
        await readBlock(4)
        expect(readSpy).not.toHaveBeenCalled()

        // Disable the cache. Now every read must hit the disk.
        store.dispatch(setCacheEnabled(false))
        await readBlock(4)
        await readBlock(4)
        expect(readSpy).toHaveBeenCalledTimes(2)
    })

    test("writes performed while disabled never populate the cache", async () => {
        store.dispatch(setCacheEnabled(false))

        await writeBlock(4, new Uint8Array(64).fill(0xAB))
        await writeBlock(5, new Uint8Array(64).fill(0xCD))
        await writeBlock(6, new Uint8Array(64).fill(0xEF))

        // The cache must remain empty: writes bypassed it entirely.
        const stats = getCacheStats()
        expect(stats.size).toBe(0)
        expect(stats.hits).toBe(0)
        expect(stats.misses).toBe(0)
    })
})

describe("BlockCache publishes stats to redux", () => {
    // The cache used to be polled by the UI on a 1s interval. It now
    // publishes its counters to the redux store after every mutation so that
    // React subscribers (e.g. the cache statistics panel) re-render exactly
    // when the underlying state changes. These tests pin that behaviour.

    test("a cache miss increments the misses counter in redux", async () => {
        const before = selectCacheStats(store.getState())
        expect(before.misses).toBe(0)
        expect(before.size).toBe(0)

        await readBlock(4)

        const after = selectCacheStats(store.getState())
        expect(after.misses).toBe(1)
        expect(after.hits).toBe(0)
        expect(after.size).toBe(1)
    })

    test("a cache hit increments the hits counter in redux", async () => {
        await readBlock(4) // populate
        await readBlock(4) // hit

        const stats = selectCacheStats(store.getState())
        expect(stats.hits).toBe(1)
        expect(stats.misses).toBe(1)
        expect(stats.size).toBe(1)
    })

    test("writeBlock publishes an updated size of 0 (write-around invalidates)", async () => {
        await readBlock(4)
        expect(selectCacheStats(store.getState()).size).toBe(1)

        await writeBlock(4, new Uint8Array(64).fill(0xAB))

        // Write-around invalidates the cached entry, so size must drop.
        expect(selectCacheStats(store.getState()).size).toBe(0)
    })

    test("clearCache resets the published stats to zero", async () => {
        await readBlock(4)
        await readBlock(4)
        expect(selectCacheStats(store.getState()).size).toBe(1)

        clearCache()

        const stats = selectCacheStats(store.getState())
        expect(stats.hits).toBe(0)
        expect(stats.misses).toBe(0)
        expect(stats.size).toBe(0)
        expect(stats.maxSize).toBeGreaterThan(0)
    })

    test("published stats include the configured maxSize", async () => {
        await readBlock(4)
        const stats = selectCacheStats(store.getState())
        // Matches the default cache capacity (64 blocks).
        expect(stats.maxSize).toBe(64)
    })

    test("redux stats stay in sync with getCacheStats() after a sequence of operations", async () => {
        await readBlock(4) // miss
        await readBlock(5) // miss
        await readBlock(4) // hit
        await writeBlock(5, new Uint8Array(64).fill(0xAB)) // invalidates 5

        const fromCache = getCacheStats()
        const fromRedux = selectCacheStats(store.getState())

        expect(fromRedux.hits).toBe(fromCache.hits)
        expect(fromRedux.misses).toBe(fromCache.misses)
        expect(fromRedux.size).toBe(fromCache.size)
        expect(fromRedux.maxSize).toBe(fromCache.maxSize)
    })

    test("toggling the cache off and on clears the published stats", async () => {
        await readBlock(4)
        await readBlock(4)
        expect(selectCacheStats(store.getState()).hits).toBe(1)

        store.dispatch(setCacheEnabled(false))
        store.dispatch(setCacheEnabled(true))

        const stats = selectCacheStats(store.getState())
        expect(stats.hits).toBe(0)
        expect(stats.misses).toBe(0)
        expect(stats.size).toBe(0)
    })

    test("redux stats update without any polling (subscriber fires synchronously after a mutation)", async () => {
        const observed: number[] = []
        const unsubscribe = store.subscribe(() => {
            observed.push(selectCacheStats(store.getState()).misses)
        })

        try {
            await readBlock(4)
        } finally {
            unsubscribe()
        }

        // The subscriber must have observed the misses counter increment to
        // 1 at some point during the read — proving stats publication is
        // event-driven, not interval-driven.
        expect(observed).toContain(1)
    })
})

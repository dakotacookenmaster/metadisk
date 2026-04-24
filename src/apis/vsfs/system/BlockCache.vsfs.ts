import { readBlock as readBlockDirect } from "./ReadBlock.vsfs"
import { writeBlock as writeBlockDirect } from "./WriteBlock.vsfs"
import ReadBlockPayload from "../../interfaces/vsfs/ReadBlockPayload.interface"
import WriteBlockPayload from "../../interfaces/vsfs/WriteBlockPayload.interface"
import { store } from "../../../store"
import { selectCacheEnabled, setCacheStats } from "../../../redux/reducers/diskSlice"

interface CacheEntry {
    blockData: ReadBlockPayload
    dirty: boolean
    lastAccessed: number
    accessCount: number
}

/**
 * The write policy used by this cache.
 * - write-through: writes go to both cache and disk simultaneously.
 * - write-back:    writes go to cache only and are flushed to disk later.
 * - write-around:  writes bypass the cache and go straight to disk; cached
 *                  entries for the written block are invalidated.
 */
export type CacheWritePolicy = "write-through" | "write-back" | "write-around"

/** The replacement policy used to evict entries when the cache is full. */
export type CacheReplacementPolicy = "LRU" | "LFU" | "FIFO" | "Random"

class BlockCache {
    private cache: Map<number, CacheEntry> = new Map()
    private maxSize: number
    private hits: number = 0
    private misses: number = 0
    public readonly writePolicy: CacheWritePolicy = "write-around"
    public readonly replacementPolicy: CacheReplacementPolicy = "LRU"

    constructor(maxSize: number = 64) {
        this.maxSize = maxSize
    }

    /**
     * Publish the current stats counters to the redux store so that React
     * subscribers (e.g. the cache statistics panel) update reactively
     * instead of relying on polling.
     */
    private publishStats(): void {
        store.dispatch(
            setCacheStats({
                hits: this.hits,
                misses: this.misses,
                size: this.cache.size,
                maxSize: this.maxSize,
            }),
        )
    }

    /**
     * Get a block from cache or read from disk
     * @param appId Optional id of the originating app, forwarded to
     *              `readBlockDirect` so disk-level requests retain attribution.
     */
    async get(blockNumber: number, progressCb?: (progress: number) => void, appId?: string): Promise<ReadBlockPayload> {
        const cached = this.cache.get(blockNumber)
        
        if (cached) {
            // Cache hit!
            this.hits++
            cached.lastAccessed = Date.now()
            cached.accessCount++
            this.publishStats()
            
            // Call progress callback to indicate instant completion
            if (progressCb) {
                progressCb(100)
            }
            
            // Return a deep copy to prevent external modifications
            const dataClone = {
                ...cached.blockData.data,
                raw: new Uint8Array(cached.blockData.data.raw),
                inodes: cached.blockData.data.inodes ? [...cached.blockData.data.inodes] : [],
            } as ReadBlockPayload['data']
            if (cached.blockData.data.directory) {
                (dataClone as { directory?: typeof cached.blockData.data.directory }).directory = {
                    ...cached.blockData.data.directory,
                    entries: [...cached.blockData.data.directory.entries],
                }
            }
            if (cached.blockData.data.superblock) {
                (dataClone as { superblock?: typeof cached.blockData.data.superblock }).superblock = {...cached.blockData.data.superblock}
            }
            return {
                ...cached.blockData,
                data: dataClone,
            }
        }

        // Cache miss - read from disk
        this.misses++
        const blockData = await readBlockDirect(blockNumber, progressCb, appId)

        // Store in cache (create a deep copy for storage)
        const dataClone = {
            ...blockData.data,
            raw: new Uint8Array(blockData.data.raw),
            inodes: blockData.data.inodes ? [...blockData.data.inodes] : [],
        } as ReadBlockPayload['data']
        if (blockData.data.directory) {
            (dataClone as { directory?: typeof blockData.data.directory }).directory = {
                ...blockData.data.directory,
                entries: [...blockData.data.directory.entries],
            }
        }
        if (blockData.data.superblock) {
            (dataClone as { superblock?: typeof blockData.data.superblock }).superblock = {...blockData.data.superblock}
        }
        
        const cacheEntry: CacheEntry = {
            blockData: {
                ...blockData,
                data: dataClone,
            },
            dirty: false,
            lastAccessed: Date.now(),
            accessCount: 1,
        }

        // Evict if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictLRU()
        }

        this.cache.set(blockNumber, cacheEntry)
        this.publishStats()
        
        // Return a copy
        return {
            ...blockData,
            data: {
                ...blockData.data,
                raw: new Uint8Array(blockData.data.raw),
            },
        }
    }

    /**
     * Write a block to cache and immediately flush to disk (write-through)
     * @param appId Optional id of the originating app, forwarded to
     *              `writeBlockDirect` so disk-level requests retain attribution.
     */
    async write(
        blockNumber: number,
        data: Uint8Array,
        progressCb?: (progress: number, taskCount: number) => void,
        appId?: string,
    ): Promise<WriteBlockPayload> {
        // Invalidate cache BEFORE writing to disk. This is important because
        // each underlying writeSector dispatches a redux update; subscribers
        // (e.g. FileSystemBlockLayout's useEffect on `sectors`) may fire
        // mid-write and call readBlock(). If we only invalidated AFTER the
        // write completed, those mid-write reads would return stale cached
        // data, and since no further `sectors` change happens after the
        // final invalidation, the UI would never see the updated block.
        this.invalidate(blockNumber)

        // Write-through to disk
        const result = await writeBlockDirect(blockNumber, data, progressCb, appId)

        // Invalidate again in case a concurrent reader re-populated the cache
        // with a partially-written view of the block during the write.
        this.invalidate(blockNumber)

        return result
    }

    /**
     * Flush all dirty blocks to disk (currently unused with write-through, but kept for future)
     */
    async flush(): Promise<void> {
        const writePromises: Promise<void>[] = []

        for (const [blockNumber, entry] of this.cache.entries()) {
            if (entry.dirty) {
                writePromises.push(
                    writeBlockDirect(blockNumber, entry.blockData.data.raw).then(() => {
                        entry.dirty = false
                    })
                )
            }
        }

        await Promise.all(writePromises)
    }

    /**
     * Invalidate a specific block (remove from cache)
     */
    invalidate(blockNumber: number): void {
        this.cache.delete(blockNumber)
        this.publishStats()
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear()
        this.hits = 0
        this.misses = 0
        this.publishStats()
    }

    /**
     * Evict the least recently used block
     */
    private evictLRU(): void {
        let lruBlockNumber: number | undefined
        let lruTime = Infinity

        for (const [blockNumber, entry] of this.cache.entries()) {
            if (entry.lastAccessed < lruTime) {
                lruTime = entry.lastAccessed
                lruBlockNumber = blockNumber
            }
        }

        if (lruBlockNumber !== undefined) {
            // If the block is dirty, we should flush it first (write-back policy)
            const entry = this.cache.get(lruBlockNumber)!
            if (entry.dirty) {
                // Fire and forget - in production you'd want to handle this better
                writeBlockDirect(lruBlockNumber, entry.blockData.data.raw).catch(console.error)
            }
            this.cache.delete(lruBlockNumber)
        }
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.hits + this.misses
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? (this.hits / total) * 100 : 0,
            size: this.cache.size,
            maxSize: this.maxSize,
            writePolicy: this.writePolicy,
            replacementPolicy: this.replacementPolicy,
        }
    }

    /**
     * Prefetch multiple blocks (for read-ahead optimization)
     */
    async prefetch(blockNumbers: number[]): Promise<void> {
        const prefetchPromises = blockNumbers
            .filter(bn => !this.cache.has(bn))
            .map(async (bn) => {
                try {
                    await this.get(bn)
                } catch (error) {
                    // Ignore prefetch errors
                    console.warn(`Failed to prefetch block ${bn}:`, error)
                }
            })

        await Promise.all(prefetchPromises)
    }
}

// Global cache instance
export const blockCache = new BlockCache(64)

// Whenever the cache is toggled on/off, clear it. This guarantees that:
//   1. Disabling the cache drops any in-memory entries (no stale reads if
//      it gets re-enabled later).
//   2. Re-enabling the cache starts from a clean slate, so the user sees
//      fresh statistics and no carryover from before it was disabled.
let lastCacheEnabled = selectCacheEnabled(store.getState())
store.subscribe(() => {
    const enabled = selectCacheEnabled(store.getState())
    if (enabled !== lastCacheEnabled) {
        lastCacheEnabled = enabled
        blockCache.clear()
    }
})

/**
 * Cached version of readBlock
 * @param appId Optional id of the originating app for disk attribution.
 *              Apps don't pass this themselves; it is injected by the
 *              `usePosix()` hook from the current `AppContext`.
 */
export async function readBlock(
    block: number,
    progressCb?: (progress: number) => void,
    appId?: string,
): Promise<ReadBlockPayload> {
    if (!selectCacheEnabled(store.getState())) {
        return readBlockDirect(block, progressCb, appId)
    }
    return blockCache.get(block, progressCb, appId)
}

/**
 * Cached version of writeBlock
 * @param appId Optional id of the originating app for disk attribution.
 *              Apps don't pass this themselves; it is injected by the
 *              `usePosix()` hook from the current `AppContext`.
 */
export async function writeBlock(
    block: number,
    data: Uint8Array,
    progressCb?: (progress: number, taskCount: number) => void,
    appId?: string,
): Promise<WriteBlockPayload> {
    if (!selectCacheEnabled(store.getState())) {
        return writeBlockDirect(block, data, progressCb, appId)
    }
    return blockCache.write(block, data, progressCb, appId)
}

/**
 * Flush all pending writes
 */
export async function flushCache() {
    await blockCache.flush()
}

/**
 * Clear cache (useful for testing)
 */
export function clearCache() {
    blockCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return blockCache.getStats()
}

/**
 * Warm up cache with critical metadata blocks
 */
export async function warmupMetadata() {
    await blockCache.prefetch([0, 1, 2])
}

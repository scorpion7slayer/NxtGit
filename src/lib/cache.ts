import { LazyStore } from "@tauri-apps/plugin-store";

type CacheRecord<T> = {
    savedAt: number;
    value: T;
};

const cacheStore = new LazyStore("cache.json");
const memoryCache = new Map<string, CacheRecord<unknown>>();

export async function getCachedValue<T>(
    key: string,
    maxAgeMs: number,
): Promise<T | null> {
    const now = Date.now();
    const memoryEntry = memoryCache.get(key);
    if (memoryEntry && now - memoryEntry.savedAt <= maxAgeMs) {
        return memoryEntry.value as T;
    }

    const persistedEntry = await cacheStore.get<CacheRecord<T>>(key);
    if (!persistedEntry) {
        return null;
    }

    memoryCache.set(key, persistedEntry as CacheRecord<unknown>);
    if (now - persistedEntry.savedAt > maxAgeMs) {
        return null;
    }

    return persistedEntry.value;
}

export async function getStaleCachedValue<T>(key: string): Promise<T | null> {
    const memoryEntry = memoryCache.get(key);
    if (memoryEntry) {
        return memoryEntry.value as T;
    }

    const persistedEntry = await cacheStore.get<CacheRecord<T>>(key);
    if (!persistedEntry) {
        return null;
    }

    memoryCache.set(key, persistedEntry as CacheRecord<unknown>);
    return persistedEntry.value;
}

export async function setCachedValue<T>(key: string, value: T): Promise<void> {
    const record: CacheRecord<T> = {
        savedAt: Date.now(),
        value,
    };
    memoryCache.set(key, record as CacheRecord<unknown>);
    await cacheStore.set(key, record);
    await cacheStore.save();
}

export async function clearCachedValuesByPrefix(prefix: string): Promise<void> {
    const keys = await cacheStore.keys();
    for (const key of keys) {
        if (key.startsWith(prefix)) {
            await cacheStore.delete(key);
        }
    }

    for (const key of Array.from(memoryCache.keys())) {
        if (key.startsWith(prefix)) {
            memoryCache.delete(key);
        }
    }

    await cacheStore.save();
}

import {
  ANIME_CACHE_DB,
  ANIME_CACHE_SCHEMA_VERSION,
  ANIME_CACHE_STORE,
  type AnimeCacheRecord,
} from '@/lib/animeCache/types'
import type { AnimeItem } from '@/types/api'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ANIME_CACHE_DB, 1)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 打开失败'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(ANIME_CACHE_STORE)) {
        db.createObjectStore(ANIME_CACHE_STORE, { keyPath: 'key' })
      }
    }
  })
}

export async function readAnimeCache(
  key: string,
): Promise<AnimeCacheRecord | null> {
  if (typeof indexedDB === 'undefined') return null
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(ANIME_CACHE_STORE, 'readonly')
      const store = tx.objectStore(ANIME_CACHE_STORE)
      const req = store.get(key)
      req.onsuccess = () => {
        const row = req.result as AnimeCacheRecord | undefined
        if (!row || row.schemaVersion !== ANIME_CACHE_SCHEMA_VERSION) {
          resolve(null)
          return
        }
        resolve(row)
      }
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => db.close()
    })
  } catch (err) {
    console.warn('[animeCache] read failed', err)
    return null
  }
}

export function maxUpdatedAtFromItems(items: AnimeItem[]): string | null {
  let max: string | null = null
  for (const item of items) {
    const ts = item.updated_at
    if (!ts) continue
    if (max == null || ts > max) max = ts
  }
  return max
}

export async function writeAnimeCache(
  record: AnimeCacheRecord,
): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ANIME_CACHE_STORE, 'readwrite')
      const store = tx.objectStore(ANIME_CACHE_STORE)
      const req = store.put(record)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => db.close()
    })
  } catch (err) {
    console.warn('[animeCache] write failed', err)
  }
}

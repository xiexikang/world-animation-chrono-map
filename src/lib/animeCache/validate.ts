import { fetchAnimeListMeta } from '@/api/anime'
import { ANIME_CACHE_TTL_MS, type AnimeCacheRecord } from '@/lib/animeCache/types'
import type { AnimeListMeta } from '@/types/api'

export type CacheFreshness = 'fresh' | 'stale' | 'unknown'

function metaMatchesCache(
  meta: AnimeListMeta,
  cache: AnimeCacheRecord,
): boolean {
  const serverMax = meta.max_updated_at ?? null
  const cacheMax = cache.maxUpdatedAt
  return meta.total === cache.total && serverMax === cacheMax
}

/** 对比服务端 meta 与本地缓存是否仍有效 */
export async function checkCacheFreshness(
  cache: AnimeCacheRecord,
  signal?: AbortSignal,
): Promise<CacheFreshness> {
  if (Date.now() - cache.savedAt > ANIME_CACHE_TTL_MS) {
    return 'stale'
  }

  try {
    const meta = await fetchAnimeListMeta(cache.filters, signal)
    if (signal?.aborted) return 'unknown'
    return metaMatchesCache(meta, cache) ? 'fresh' : 'stale'
  } catch (err) {
    if (signal?.aborted) return 'unknown'
    console.warn('[animeCache] meta check failed', err)
    return Date.now() - cache.savedAt <= ANIME_CACHE_TTL_MS ? 'unknown' : 'stale'
  }
}

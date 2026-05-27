import { fetchAllAnimeItems } from '@/api/anime'
import { buildAnimeCacheKey } from '@/lib/animeListFilters'
import { stripAnimeItemsForCache } from '@/lib/animeCache/stripItem'
import {
  maxUpdatedAtFromItems,
  readAnimeCache,
  writeAnimeCache,
} from '@/lib/animeCache/db'
import {
  ANIME_CACHE_SCHEMA_VERSION,
  type AnimeCacheRecord,
} from '@/lib/animeCache/types'
import { checkCacheFreshness } from '@/lib/animeCache/validate'
import { animeItemsToNodes } from '@/lib/nodes'
import type { ThemeDictionary } from '@/lib/themeDictionary'
import type { AnimationNode } from '@/types'
import type { AnimeItem, AnimeListParams } from '@/types/api'

export interface LoadAnimeWithCacheOptions {
  filters: Omit<AnimeListParams, 'page' | 'page_size'>
  themeDictionary: ThemeDictionary
  signal?: AbortSignal
  onProgress?: (loaded: number, total: number | null) => void
  onBatch?: (nodes: AnimationNode[]) => void
  /** 从 IndexedDB 读出后立刻展示；willRefresh 为 true 时仍会走网络更新 */
  onCacheHydrate?: (nodes: AnimationNode[], willRefresh: boolean) => void
}

function itemsToNodes(
  items: AnimeItem[],
  dictionary: ThemeDictionary,
): AnimationNode[] {
  return animeItemsToNodes(items, dictionary)
}

async function persistCache(
  key: string,
  filters: Omit<AnimeListParams, 'page' | 'page_size'>,
  items: AnimeItem[],
): Promise<void> {
  const record: AnimeCacheRecord = {
    schemaVersion: ANIME_CACHE_SCHEMA_VERSION,
    key,
    filters,
    items: stripAnimeItemsForCache(items),
    total: items.length,
    maxUpdatedAt: maxUpdatedAtFromItems(items),
    savedAt: Date.now(),
  }
  await writeAnimeCache(record)
}

async function fetchFromNetwork(
  options: LoadAnimeWithCacheOptions,
): Promise<AnimationNode[]> {
  const { filters, themeDictionary, signal, onProgress, onBatch } = options

  const items = await fetchAllAnimeItems({
    signal,
    filters,
    onProgress,
    onBatch: onBatch
      ? (pageItems) => {
          const nodes = itemsToNodes(pageItems, themeDictionary)
          if (nodes.length > 0) onBatch(nodes)
        }
      : undefined,
  })

  const nodes = itemsToNodes(items, themeDictionary)
  await persistCache(buildAnimeCacheKey(filters), filters, items)
  return nodes
}

/** 优先 IndexedDB，再按 /api/animes/meta 决定是否打网络 */
export async function loadAnimeWithCache(
  options: LoadAnimeWithCacheOptions,
): Promise<AnimationNode[]> {
  const { filters, themeDictionary, signal, onCacheHydrate } = options
  const cacheKey = buildAnimeCacheKey(filters)
  const cached = await readAnimeCache(cacheKey)

  if (cached && cached.items.length > 0) {
    const cachedNodes = itemsToNodes(cached.items, themeDictionary)
    const freshness = await checkCacheFreshness(cached, signal)
    if (signal?.aborted) return cachedNodes

    const willRefresh = freshness === 'stale'
    onCacheHydrate?.(cachedNodes, willRefresh)

    if (!willRefresh) {
      return cachedNodes
    }
  }

  return fetchFromNetwork(options)
}

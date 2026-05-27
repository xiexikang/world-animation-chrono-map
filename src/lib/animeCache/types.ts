import type { AnimeItem, AnimeListParams } from '@/types/api'

export const ANIME_CACHE_DB = 'chrono-map-anime-v1'
export const ANIME_CACHE_STORE = 'entries'
export const ANIME_CACHE_SCHEMA_VERSION = 2
/** 无 meta 校验时的最长可用时间 */
export const ANIME_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export interface AnimeCacheRecord {
  schemaVersion: typeof ANIME_CACHE_SCHEMA_VERSION
  key: string
  filters: Omit<AnimeListParams, 'page' | 'page_size'>
  items: AnimeItem[]
  total: number
  maxUpdatedAt: string | null
  savedAt: number
}

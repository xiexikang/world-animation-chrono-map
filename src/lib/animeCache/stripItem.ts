import type { AnimeItem } from '@/types/api'

/** 写入 IndexedDB 前去掉大字段 */
export function stripAnimeItemForCache(item: AnimeItem): AnimeItem {
  return {
    ...item,
    overview: item.overview ? '' : null,
    backdrop_path: null,
  }
}

export function stripAnimeItemsForCache(items: AnimeItem[]): AnimeItem[] {
  return items.map(stripAnimeItemForCache)
}

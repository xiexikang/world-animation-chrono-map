import type { AnimeListParams } from '@/types/api'

const DEFAULT_SORT = {
  sort_by: 'first_air_date' as const,
  sort_order: 'desc' as const,
}

/**
 * 网络/IndexedDB 仅按国家（或全球）分片；年代/主题/搜索在客户端筛选。
 */
export function buildAnimeFetchFilters(
  countryCode?: string,
): Omit<AnimeListParams, 'page' | 'page_size'> {
  const filters: Omit<AnimeListParams, 'page' | 'page_size'> = {
    ...DEFAULT_SORT,
  }
  if (countryCode) {
    filters.country_code = countryCode
  }
  return filters
}

/** IndexedDB 缓存键（仅国家/全球维度） */
export function buildAnimeCacheKey(
  filters: Omit<AnimeListParams, 'page' | 'page_size'>,
): string {
  const normalized: Record<string, string> = {
    sort_by: filters.sort_by ?? DEFAULT_SORT.sort_by,
    sort_order: filters.sort_order ?? DEFAULT_SORT.sort_order,
    scope: filters.country_code ?? '__ALL__',
  }
  return JSON.stringify(normalized)
}

export function countryScopeKey(countries: string[]): string {
  return countries.length === 1 ? countries[0]! : '__ALL__'
}

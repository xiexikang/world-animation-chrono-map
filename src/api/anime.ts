import { apiGet, apiPost } from '@/api/http'
import type {
  AnimeItem,
  AnimeListParams,
  PaginatedData,
} from '@/types/api'

const LIST_PATH = '/api/animes'
const PAGE_SIZE = 100

export async function fetchAnimePage(
  params: AnimeListParams,
): Promise<PaginatedData<AnimeItem>> {
  return apiPost<PaginatedData<AnimeItem>>(LIST_PATH, {
    page: 1,
    page_size: PAGE_SIZE,
    sort_by: 'popularity',
    sort_order: 'desc',
    ...params,
  })
}

export async function fetchAnimeDetail(
  tmdbId: number,
  countryCode: string,
): Promise<AnimeItem> {
  return apiGet<AnimeItem>(
    `/api/animes/${tmdbId}/${encodeURIComponent(countryCode)}`,
  )
}

export type LoadProgress = (loaded: number, total: number | null) => void

/** 分页拉取动画（可按国家筛选） */
export async function fetchAllAnimeItems(
  onProgress?: LoadProgress,
  filters: Omit<AnimeListParams, 'page' | 'page_size'> = {},
): Promise<AnimeItem[]> {
  const first = await fetchAnimePage({ page: 1, page_size: PAGE_SIZE, ...filters })
  const total = first.pagination.total
  const totalPages = first.pagination.total_pages
  const items = [...first.items]
  onProgress?.(items.length, total)

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchAnimePage({ page, page_size: PAGE_SIZE, ...filters })
    items.push(...next.items)
    onProgress?.(items.length, total)
  }

  return items
}

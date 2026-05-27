import { apiGet, apiPost } from '@/api/http'
import type {
  AnimeItem,
  AnimeListMeta,
  AnimeListParams,
  PaginatedData,
} from '@/types/api'

const LIST_PATH = '/api/animes'
/** 与后端 page_size 上限一致 */
export const ANIME_PAGE_SIZE = 300
const LIST_FIELDS: AnimeListParams['fields'] = 'lite'
/** 首页之后的并发页数上限 */
const FETCH_CONCURRENCY = 4

export async function fetchAnimePage(
  params: AnimeListParams,
  signal?: AbortSignal,
): Promise<PaginatedData<AnimeItem>> {
  return apiPost<PaginatedData<AnimeItem>>(
    LIST_PATH,
    {
      page: 1,
      page_size: ANIME_PAGE_SIZE,
      fields: LIST_FIELDS,
      sort_by: 'popularity',
      sort_order: 'desc',
      ...params,
    },
    { signal },
  )
}

export async function fetchAnimeListMeta(
  filters: Omit<AnimeListParams, 'page' | 'page_size'>,
  signal?: AbortSignal,
): Promise<AnimeListMeta> {
  return apiPost<AnimeListMeta>(`${LIST_PATH}/meta`, { fields: LIST_FIELDS, ...filters }, { signal })
}

export async function fetchAnimeDetail(
  tmdbId: number,
  countryCode: string,
  signal?: AbortSignal,
): Promise<AnimeItem> {
  return apiGet<AnimeItem>(
    `/api/animes/${tmdbId}/${encodeURIComponent(countryCode)}`,
    { signal },
  )
}

export type LoadProgress = (loaded: number, total: number | null) => void

export interface FetchAllAnimeOptions {
  onProgress?: LoadProgress
  /** 每拉完一页（含第 1 页）回调，用于首屏先渲染 */
  onBatch?: (items: AnimeItem[], page: number) => void
  signal?: AbortSignal
  filters?: Omit<AnimeListParams, 'page' | 'page_size'>
}

async function fetchPagesParallel(
  pages: number[],
  filters: Omit<AnimeListParams, 'page' | 'page_size'>,
  signal: AbortSignal | undefined,
  onPage: (data: PaginatedData<AnimeItem>, page: number) => void,
): Promise<void> {
  for (let i = 0; i < pages.length; i += FETCH_CONCURRENCY) {
    const chunk = pages.slice(i, i + FETCH_CONCURRENCY)
    const results = await Promise.all(
      chunk.map((page) =>
        fetchAnimePage({ ...filters, page, page_size: ANIME_PAGE_SIZE }, signal),
      ),
    )
    for (let j = 0; j < results.length; j += 1) {
      onPage(results[j]!, chunk[j]!)
    }
  }
}

/** 分页拉取动画（支持筛选、并行后续页、可取消） */
export async function fetchAllAnimeItems(
  options: FetchAllAnimeOptions = {},
): Promise<AnimeItem[]> {
  const { onProgress, onBatch, signal, filters = {} } = options
  const items: AnimeItem[] = []

  const first = await fetchAnimePage(
    { page: 1, page_size: ANIME_PAGE_SIZE, ...filters },
    signal,
  )
  const total = first.pagination.total
  const totalPages = first.pagination.total_pages
  items.push(...first.items)
  onBatch?.(first.items, 1)
  onProgress?.(items.length, total)

  if (totalPages <= 1) return items

  const restPages = Array.from(
    { length: totalPages - 1 },
    (_, index) => index + 2,
  )

  await fetchPagesParallel(restPages, filters, signal, (data, page) => {
    items.push(...data.items)
    onBatch?.(data.items, page)
    onProgress?.(items.length, total)
  })

  return items
}

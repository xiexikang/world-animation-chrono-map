export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface PaginatedData<T> {
  items: T[]
  pagination: PaginationMeta
}

export type AnimeSortBy =
  | 'popularity'
  | 'vote_average'
  | 'first_air_date'
  | 'created_at'

export type AnimeSortOrder = 'asc' | 'desc'

export type AnimeListFields = 'full' | 'lite'

export interface AnimeListParams {
  page?: number
  page_size?: number
  fields?: AnimeListFields
  keyword?: string
  country_code?: string
  genre_id?: number
  decade?: number
  sort_by?: AnimeSortBy
  sort_order?: AnimeSortOrder
}

/** POST /api/animes/meta 响应 */
export interface AnimeListMeta {
  total: number
  max_updated_at: string | null
}

/** 与后端 ThemeItem 字段一致 */
export interface ThemeItem {
  tmdb_genre_id: number
  name: string
  sort_order: number
  show_in_tags: boolean
  created_at: string
  updated_at: string
}

/** 与后端 CountryItem 字段一致 */
export interface CountryItem {
  code: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

/** GET /api/countries/stats */
export interface CountryStatItem {
  code: string
  total: number
}

/** 列表 lite 响应（无 overview / backdrop 等大字段） */
export interface AnimeItemLite {
  tmdb_id: number
  country_code: string
  poster_path: string | null
  full_poster_path: string
  original_name: string
  name: string
  popularity: number | string
  first_air_date: string | null
  vote_average: number | string
  genre_ids: unknown[]
  created_at: string
  updated_at: string
}

/** 与后端 AnimeItem 字段一致（详情 / fields=full） */
export interface AnimeItem extends AnimeItemLite {
  adult: boolean
  backdrop_path: string | null
  original_language: string
  overview: string | null
  softcore: boolean
  vote_count: number
  origin_country: unknown[]
}

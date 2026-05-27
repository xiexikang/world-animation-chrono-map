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

export interface AnimeListParams {
  page?: number
  page_size?: number
  keyword?: string
  country_code?: string
  genre_id?: number
  decade?: number
  sort_by?: AnimeSortBy
  sort_order?: AnimeSortOrder
}

/** 与后端 AnimeItem 字段一致 */
export interface AnimeItem {
  tmdb_id: number
  country_code: string
  adult: boolean
  backdrop_path: string | null
  poster_path: string | null
  full_poster_path: string
  original_language: string
  original_name: string
  name: string
  overview: string | null
  popularity: number | string
  first_air_date: string | null
  softcore: boolean
  vote_average: number | string
  vote_count: number
  genre_ids: unknown[]
  origin_country: unknown[]
  created_at: string
  updated_at: string
}

/** TMDB discover/tv 单条结果（与 raw_anime_CN.json / animationData.json 一致） */
export interface TmdbAnimeRecord {
  adult: boolean
  backdrop_path: string | null
  genre_ids: number[]
  id: number
  /** 后端数据源国家码（与 tmdb_id 组成唯一键） */
  country_code?: string
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string | null
  first_air_date: string
  softcore?: boolean
  name: string
  vote_average: number
  vote_count: number
  full_poster_path?: string
}

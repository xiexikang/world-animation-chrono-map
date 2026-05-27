import type { AnimeItem } from '@/types/api'
import type { TmdbAnimeRecord } from '@/types/tmdb'

function toNumberArray(values: unknown[]): number[] {
  return values
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((n) => Number.isFinite(n))
}

function toStringArray(values: unknown[]): string[] {
  return values.map((v) => String(v))
}

/** 后端 AnimeItem → 现有 tmdbToNode 可消费的 TMDB 结构 */
export function animeItemToTmdbRecord(item: AnimeItem): TmdbAnimeRecord {
  return {
    adult: item.adult,
    backdrop_path: item.backdrop_path,
    genre_ids: toNumberArray(item.genre_ids ?? []),
    id: item.tmdb_id,
    country_code: item.country_code,
    origin_country: toStringArray(item.origin_country ?? []),
    original_language: item.original_language,
    original_name: item.original_name,
    overview: item.overview ?? '',
    popularity: Number(item.popularity),
    poster_path: item.poster_path,
    first_air_date: item.first_air_date ?? '',
    softcore: item.softcore,
    name: item.name,
    vote_average: Number(item.vote_average),
    vote_count: item.vote_count,
    full_poster_path: item.full_poster_path,
  }
}

export function animeItemsToTmdbRecords(items: AnimeItem[]): TmdbAnimeRecord[] {
  return items.map(animeItemToTmdbRecord)
}

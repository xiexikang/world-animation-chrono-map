import type { AnimationNode, CountryCode, EraCode } from '@/types'
import type { TmdbAnimeRecord } from '@/types/tmdb'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

const GENRE_MAP: Record<number, string> = {
  16: '动画',
  10759: '动作冒险',
  35: '喜剧幽默',
  10765: '科幻奇幻',
  10751: '家庭合家欢',
  18: '剧情思考',
}

const SOURCE_COUNTRY_MAP: Record<string, CountryCode> = {
  CN: 'CN',
  JP: 'JP',
  US: 'US',
  FR: 'EU',
  BE: 'EU',
  FI: 'EU',
  RU: 'EU',
  GB: 'UK',
  IE: 'UK',
}

function mapCountry(origin: string[] | undefined): CountryCode {
  const raw = origin?.[0]
  if (!raw) return 'OTHER'
  return SOURCE_COUNTRY_MAP[raw] ?? 'OTHER'
}

/** 与 Timeline ERA_OPTIONS 一致：60 / 70 / … / 20 */
export function eraFromYear(year: number): EraCode {
  if (year < 1970) return '60'
  if (year < 1980) return '70'
  if (year < 1990) return '80'
  if (year < 2000) return '90'
  if (year < 2010) return '00'
  if (year < 2020) return '10'
  return '20'
}

function eraFromFirstAirDate(firstAirDate: string | undefined): EraCode {
  const year = yearFromFirstAirDate(firstAirDate)
  return year != null ? eraFromYear(year) : '20'
}

function yearFromFirstAirDate(firstAirDate: string | undefined): number | undefined {
  if (!firstAirDate || firstAirDate.length < 4) return undefined
  const year = Number.parseInt(firstAirDate.slice(0, 4), 10)
  return Number.isNaN(year) ? undefined : year
}

function mapThemes(genreIds: number[]): string[] {
  const themes = genreIds
    .map((gid) => GENRE_MAP[gid])
    .filter((label): label is string => Boolean(label) && label !== '动画')
  return themes.length > 0 ? themes : ['经典']
}

function posterUrl(record: TmdbAnimeRecord): string {
  if (record.full_poster_path) return record.full_poster_path
  if (record.poster_path) return `${TMDB_IMAGE_BASE}${record.poster_path}`
  return ''
}

/** TMDB 原始条目 → 应用内 AnimationNode */
export function tmdbRecordToNode(record: TmdbAnimeRecord): AnimationNode | null {
  const title = record.name?.trim()
  const cover = posterUrl(record)
  if (!title || !cover) return null

  const era = eraFromFirstAirDate(record.first_air_date)
  const overview = record.overview?.trim() ?? ''

  return {
    id: `tmdb-${record.id}`,
    title,
    titleEn: record.original_name !== record.name ? record.original_name : undefined,
    country: mapCountry(record.origin_country),
    era,
    year: yearFromFirstAirDate(record.first_air_date),
    themes: mapThemes(record.genre_ids ?? []),
    cover,
    description: overview || undefined,
    quote: overview
      ? overview.length > 32
        ? `${overview.slice(0, 32)}...`
        : overview
      : undefined,
    popularity: record.popularity,
  }
}

export function tmdbRecordsToNodes(records: TmdbAnimeRecord[]): AnimationNode[] {
  return records
    .map(tmdbRecordToNode)
    .filter((node): node is AnimationNode => node !== null)
}

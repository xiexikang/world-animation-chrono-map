import {
  fetchAllAnimeItems,
  type FetchAllAnimeOptions,
  type LoadProgress,
} from '@/api/anime'
import { fetchThemes } from '@/api/theme'
import {
  buildThemeDictionary,
  mapGenreIdsToThemes,
  type ThemeDictionary,
} from '@/lib/themeDictionary'
import type { AnimeItem } from '@/types/api'
import type { AnimationNode, CountryCode, EraCode } from '@/types'
import type { AnimeListParams } from '@/types/api'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

const ORIGIN_TO_REGION: Record<string, CountryCode> = {
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

function toNumberArray(values: unknown[]): number[] {
  return values
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((n) => Number.isFinite(n))
}

function toStringArray(values: unknown[]): string[] {
  return values.map((v) => String(v))
}

function mapRegion(origin: unknown[]): CountryCode {
  const raw = toStringArray(origin)[0]
  if (!raw) return 'OTHER'
  return ORIGIN_TO_REGION[raw] ?? 'OTHER'
}

function eraFromYear(year: number): EraCode {
  if (year < 1970) return '60'
  if (year < 1980) return '70'
  if (year < 1990) return '80'
  if (year < 2000) return '90'
  if (year < 2010) return '00'
  if (year < 2020) return '10'
  return '20'
}

function yearFromDate(value: string | null | undefined): number | undefined {
  if (!value || value.length < 4) return undefined
  const year = Number.parseInt(value.slice(0, 4), 10)
  return Number.isNaN(year) ? undefined : year
}

function posterUrl(item: AnimeItem): string {
  if (item.full_poster_path) return item.full_poster_path
  if (item.poster_path) return `${TMDB_IMAGE_BASE}${item.poster_path}`
  return ''
}

/** 后端 AnimeItem → 应用内 AnimationNode */
export function animeItemToNode(
  item: AnimeItem,
  themeDictionary: ThemeDictionary,
): AnimationNode | null {
  const title = item.name?.trim()
  const cover = posterUrl(item)
  if (!title || !cover) return null

  const year = yearFromDate(item.first_air_date)
  const era = year != null ? eraFromYear(year) : '20'
  const overview = item.overview?.trim() ?? ''
  const genreIds = toNumberArray(item.genre_ids ?? [])

  return {
    id: item.country_code
      ? `tmdb-${item.tmdb_id}-${item.country_code}`
      : `tmdb-${item.tmdb_id}`,
    title,
    titleEn: item.original_name !== item.name ? item.original_name : undefined,
    countryCode: item.country_code?.toUpperCase(),
    country: mapRegion(item.origin_country ?? []),
    era,
    year,
    themes: mapGenreIdsToThemes(genreIds, themeDictionary),
    cover,
    description: overview || undefined,
    quote: overview
      ? overview.length > 32
        ? `${overview.slice(0, 32)}...`
        : overview
      : undefined,
    popularity: Number(item.popularity),
  }
}

export function animeItemsToNodes(
  items: AnimeItem[],
  themeDictionary: ThemeDictionary,
): AnimationNode[] {
  return items
    .map((item) => animeItemToNode(item, themeDictionary))
    .filter((node): node is AnimationNode => node !== null)
}

export interface LoadAnimationNodesOptions {
  onProgress?: LoadProgress
  /** 每页转换后的节点，用于首屏先展示 */
  onBatch?: (nodes: AnimationNode[]) => void
  signal?: AbortSignal
  themeDictionary?: ThemeDictionary
  filters?: Omit<AnimeListParams, 'page' | 'page_size'>
}

/** 从后端分页拉取并转为 AnimationNode（支持渐进批次） */
export async function loadAnimationNodes(
  options: LoadAnimationNodesOptions = {},
): Promise<AnimationNode[]> {
  const dictionary =
    options.themeDictionary ?? buildThemeDictionary(await fetchThemes())

  const fetchOptions: FetchAllAnimeOptions = {
    signal: options.signal,
    filters: options.filters ?? {},
    onProgress: options.onProgress,
    onBatch: options.onBatch
      ? (items) => {
          options.onBatch?.(animeItemsToNodes(items, dictionary))
        }
      : undefined,
  }

  const items = await fetchAllAnimeItems(fetchOptions)
  return animeItemsToNodes(items, dictionary)
}

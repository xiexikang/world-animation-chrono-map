/** 后端 /api/countries 支持的 ISO 码 */
export const SOURCE_COUNTRY_CODES = [
  'BE',
  'CN',
  'CZ',
  'FI',
  'FR',
  'GB',
  'IE',
  'JP',
  'KR',
  'US',
] as const

export type SourceCountryCode = (typeof SOURCE_COUNTRY_CODES)[number]

/** 地球节点/轮廓区域：10 个数据源国 + 未收录的 TMDB 出品国 */
export type CountryCode = SourceCountryCode | 'OTHER'

export function isSourceCountryCode(code: string): code is SourceCountryCode {
  return (SOURCE_COUNTRY_CODES as readonly string[]).includes(
    code.toUpperCase(),
  )
}

/** 年代十位码，与 cover 数据集一致：60 / 70 / 80 / 90 / 00 / 10 / 20 … */
export type EraCode = string

export interface AnimationNode {
  id: string
  title: string
  titleEn?: string
  /** 后端数据源国家码（/api/countries） */
  countryCode?: string
  country: CountryCode
  era: EraCode
  year?: number
  themes: string[]
  cover: string
  description?: string
  quote?: string
  externalUrl?: string
  /** TMDB popularity，用于地球展示优先级 */
  popularity?: number
}

export interface RegionBounds {
  code: CountryCode
  label: string
  x: number
  y: number
  width: number
  height: number
  tint: number
}

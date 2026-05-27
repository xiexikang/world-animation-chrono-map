export type CountryCode = 'CN' | 'JP' | 'US' | 'EU' | 'UK' | 'OTHER'

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

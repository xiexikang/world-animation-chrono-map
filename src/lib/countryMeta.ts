import type { CountryItem } from '@/types/api'

export interface CountryDisplayMeta {
  code: string
  label: string
  flag: string
  en: string
}

/** ISO 3166-1 alpha-2 → 国旗 emoji */
export function isoFlagEmoji(code: string): string {
  const upper = code.toUpperCase()
  if (upper.length !== 2 || !/^[A-Z]{2}$/.test(upper)) return '🌍'
  const points = [...upper].map(
    (char) => 0x1f1e6 + char.charCodeAt(0) - 65,
  )
  return String.fromCodePoint(...points)
}

export function getCountryDisplayMeta(
  code: string,
  categories: CountryItem[],
): CountryDisplayMeta {
  const upper = code.toUpperCase()
  const found = categories.find((c) => c.code.toUpperCase() === upper)
  return {
    code: upper,
    label: found?.name ?? upper,
    flag: isoFlagEmoji(upper),
    en: upper,
  }
}

import { fetchCountries } from '@/api/country'
import { USE_STATIC_DATA } from '@/config'
import { FALLBACK_COUNTRY_CATEGORIES } from '@/constants'
import type { CountryItem } from '@/types/api'

/** 从后端或本地兜底加载国家分类 */
export async function loadCountryCategories(): Promise<CountryItem[]> {
  if (USE_STATIC_DATA) {
    return FALLBACK_COUNTRY_CATEGORIES
  }
  const list = await fetchCountries()
  return [...list].sort((a, b) => a.sort_order - b.sort_order)
}

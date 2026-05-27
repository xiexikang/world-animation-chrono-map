import { apiGet } from '@/api/http'
import type { CountryItem } from '@/types/api'

export async function fetchCountries(): Promise<CountryItem[]> {
  const list = await apiGet<CountryItem[]>('/api/countries')
  return [...list].sort(
    (a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code),
  )
}

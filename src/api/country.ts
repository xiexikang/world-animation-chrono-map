import { apiGet } from '@/api/http'
import type { CountryItem } from '@/types/api'

export async function fetchCountries(): Promise<CountryItem[]> {
  return apiGet<CountryItem[]>('/api/countries')
}

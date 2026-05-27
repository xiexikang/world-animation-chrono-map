import { apiGet } from '@/api/http'
import type { CountryItem } from '@/types/api'

let cachedCountries: CountryItem[] | null = null
let inflight: Promise<CountryItem[]> | null = null

function sortCountries(list: CountryItem[]): CountryItem[] {
  return [...list].sort(
    (a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code),
  )
}

export async function fetchCountries(): Promise<CountryItem[]> {
  if (cachedCountries) return cachedCountries
  if (inflight) return inflight

  inflight = apiGet<CountryItem[]>('/api/countries')
    .then((list) => {
      cachedCountries = sortCountries(list)
      return cachedCountries
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

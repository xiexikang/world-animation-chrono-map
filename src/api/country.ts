import { apiGet } from '@/api/http'
import type { CountryItem, CountryStatItem } from '@/types/api'

let cachedCountries: CountryItem[] | null = null
let countriesInflight: Promise<CountryItem[]> | null = null

let cachedStats: Map<string, number> | null = null
let statsInflight: Promise<Map<string, number>> | null = null

function sortCountries(list: CountryItem[]): CountryItem[] {
  return [...list].sort(
    (a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code),
  )
}

function statsToMap(list: CountryStatItem[]): Map<string, number> {
  return new Map(list.map((row) => [row.code, row.total]))
}

export async function fetchCountries(): Promise<CountryItem[]> {
  if (cachedCountries) return cachedCountries
  if (countriesInflight) return countriesInflight

  countriesInflight = apiGet<CountryItem[]>('/api/countries')
    .then((list) => {
      cachedCountries = sortCountries(list)
      return cachedCountries
    })
    .finally(() => {
      countriesInflight = null
    })

  return countriesInflight
}

export async function fetchCountryStats(): Promise<Map<string, number>> {
  if (cachedStats) return cachedStats
  if (statsInflight) return statsInflight

  statsInflight = apiGet<CountryStatItem[]>('/api/countries/stats')
    .then((list) => {
      cachedStats = statsToMap(list)
      return cachedStats
    })
    .finally(() => {
      statsInflight = null
    })

  return statsInflight
}

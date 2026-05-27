import { apiGet } from '@/api/http'
import type { ThemeItem } from '@/types/api'

let cachedThemes: ThemeItem[] | null = null
let inflight: Promise<ThemeItem[]> | null = null

function sortThemes(list: ThemeItem[]): ThemeItem[] {
  return [...list].sort(
    (a, b) => a.sort_order - b.sort_order || a.tmdb_genre_id - b.tmdb_genre_id,
  )
}

export async function fetchThemes(): Promise<ThemeItem[]> {
  if (cachedThemes) return cachedThemes
  if (inflight) return inflight

  inflight = apiGet<ThemeItem[]>('/api/themes')
    .then((list) => {
      cachedThemes = sortThemes(list)
      return cachedThemes
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

import { apiGet } from '@/api/http'
import type { ThemeItem } from '@/types/api'

let cachedThemes: ThemeItem[] | null = null

export async function fetchThemes(): Promise<ThemeItem[]> {
  if (cachedThemes) {
    return cachedThemes
  }
  const list = await apiGet<ThemeItem[]>('/api/themes')
  cachedThemes = [...list].sort(
    (a, b) => a.sort_order - b.sort_order || a.tmdb_genre_id - b.tmdb_genre_id,
  )
  return cachedThemes
}

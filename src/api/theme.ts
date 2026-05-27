import { apiGet } from '@/api/http'
import type { ThemeItem } from '@/types/api'

export async function fetchThemes(): Promise<ThemeItem[]> {
  return apiGet<ThemeItem[]>('/api/themes')
}

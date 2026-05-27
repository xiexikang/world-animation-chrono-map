import { fetchThemes } from '@/api/theme'
import { USE_STATIC_DATA } from '@/config'
import {
  buildThemeDictionary,
  type ThemeDictionary,
} from '@/lib/themeDictionary'
import type { ThemeItem } from '@/types/api'

/** 无后端时的兜底主题字典（与原 GENRE_MAP 一致） */
export const FALLBACK_THEME_ITEMS: ThemeItem[] = [
  {
    tmdb_genre_id: 16,
    name: '动画',
    sort_order: 1,
    show_in_tags: false,
    created_at: '',
    updated_at: '',
  },
  {
    tmdb_genre_id: 10759,
    name: '动作冒险',
    sort_order: 2,
    show_in_tags: true,
    created_at: '',
    updated_at: '',
  },
  {
    tmdb_genre_id: 35,
    name: '喜剧幽默',
    sort_order: 3,
    show_in_tags: true,
    created_at: '',
    updated_at: '',
  },
  {
    tmdb_genre_id: 10765,
    name: '科幻奇幻',
    sort_order: 4,
    show_in_tags: true,
    created_at: '',
    updated_at: '',
  },
  {
    tmdb_genre_id: 10751,
    name: '家庭合家欢',
    sort_order: 5,
    show_in_tags: true,
    created_at: '',
    updated_at: '',
  },
  {
    tmdb_genre_id: 18,
    name: '剧情思考',
    sort_order: 6,
    show_in_tags: true,
    created_at: '',
    updated_at: '',
  },
]

let cachedThemeItems: ThemeItem[] | null = null

function sortThemeItems(items: ThemeItem[]): ThemeItem[] {
  return [...items].sort(
    (a, b) => a.sort_order - b.sort_order || a.tmdb_genre_id - b.tmdb_genre_id,
  )
}

/** GET /api/themes（静态模式用本地兜底） */
export async function loadThemeItems(): Promise<ThemeItem[]> {
  if (USE_STATIC_DATA) {
    return FALLBACK_THEME_ITEMS
  }
  if (cachedThemeItems) {
    return cachedThemeItems
  }
  const list = await fetchThemes()
  cachedThemeItems = sortThemeItems(list)
  return cachedThemeItems
}

export async function loadThemeDictionary(): Promise<ThemeDictionary> {
  return buildThemeDictionary(await loadThemeItems())
}

export function buildThemeDictionaryFromItems(
  items: ThemeItem[],
): ThemeDictionary {
  return buildThemeDictionary(items)
}

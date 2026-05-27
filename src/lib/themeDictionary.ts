import type { ThemeItem } from '@/types/api'

export interface ThemeDictEntry {
  name: string
  showInTags: boolean
}

export type ThemeDictionary = Record<number, ThemeDictEntry>

export const DEFAULT_THEME_FALLBACK = '经典'

/** 主题列表 → 按 tmdb_genre_id 索引的字典 */
export function buildThemeDictionary(themes: ThemeItem[]): ThemeDictionary {
  const dict: ThemeDictionary = {}
  for (const item of themes) {
    dict[item.tmdb_genre_id] = {
      name: item.name,
      showInTags: item.show_in_tags,
    }
  }
  return dict
}

/** 供筛选面板展示的主题名（已排序） */
export function tagThemeOptions(themes: ThemeItem[]): string[] {
  return themes
    .filter((t) => t.show_in_tags)
    .sort((a, b) => a.sort_order - b.sort_order || a.tmdb_genre_id - b.tmdb_genre_id)
    .map((t) => t.name)
}

/** genre_ids → 作品主题标签 */
export function mapGenreIdsToThemes(
  genreIds: number[],
  dictionary: ThemeDictionary,
  fallback = DEFAULT_THEME_FALLBACK,
): string[] {
  const themes = genreIds
    .map((id) => dictionary[id])
    .filter((entry): entry is ThemeDictEntry => Boolean(entry?.showInTags))
    .map((entry) => entry.name)
  return themes.length > 0 ? themes : [fallback]
}

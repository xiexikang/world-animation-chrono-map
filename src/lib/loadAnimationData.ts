import animationDataUrl from '@/data/animationData.json?url'
import { fetchAllAnimeItems, type LoadProgress } from '@/api/anime'
import { USE_STATIC_DATA } from '@/config'
import { animeItemsToTmdbRecords } from '@/lib/animeToTmdb'
import { loadThemeDictionary } from '@/lib/loadThemeDictionary'
import { tmdbRecordsToNodes } from '@/lib/tmdbToNode'
import type { ThemeDictionary } from '@/lib/themeDictionary'
import type { AnimationNode } from '@/types'
import type { TmdbAnimeRecord } from '@/types/tmdb'

async function loadStaticTmdbRecords(): Promise<TmdbAnimeRecord[]> {
  const res = await fetch(animationDataUrl)
  if (!res.ok) {
    throw new Error(`无法加载 animationData.json (${res.status})`)
  }
  const raw = (await res.json()) as TmdbAnimeRecord[]
  if (!Array.isArray(raw)) {
    throw new Error('animationData.json 格式无效：应为数组')
  }
  return raw
}

/** 从后端 API 或本地 JSON 加载并转为 AnimationNode */
export async function loadAnimationNodes(
  onProgress?: LoadProgress,
  themeDictionary?: ThemeDictionary,
): Promise<AnimationNode[]> {
  const dictionary = themeDictionary ?? (await loadThemeDictionary())

  if (USE_STATIC_DATA) {
    const raw = await loadStaticTmdbRecords()
    return tmdbRecordsToNodes(raw, dictionary)
  }

  const items = await fetchAllAnimeItems(onProgress)
  const records = animeItemsToTmdbRecords(items)
  return tmdbRecordsToNodes(records, dictionary)
}

/** 供外部在已持有主题字典时转换（测试或复用） */
export function convertTmdbRecords(
  records: TmdbAnimeRecord[],
  themeDictionary: ThemeDictionary,
): AnimationNode[] {
  return tmdbRecordsToNodes(records, themeDictionary)
}

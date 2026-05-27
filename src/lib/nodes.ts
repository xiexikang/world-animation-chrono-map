import {
  fetchAllAnimeItems,
  type FetchAllAnimeOptions,
  type LoadProgress,
} from '@/api/anime'
import { animeItemsToNodesAsync } from '@/lib/animeItemsWorker'
import { animeItemsToNodes } from '@/lib/convertAnimeItems'
import { fetchThemes } from '@/api/theme'
import {
  buildThemeDictionary,
  type ThemeDictionary,
} from '@/lib/themeDictionary'
import type { AnimeListParams } from '@/types/api'
import type { AnimationNode } from '@/types'

export { animeItemToNode, animeItemsToNodes } from '@/lib/convertAnimeItems'

export interface LoadAnimationNodesOptions {
  onProgress?: LoadProgress
  onBatch?: (nodes: AnimationNode[]) => void
  signal?: AbortSignal
  themeDictionary?: ThemeDictionary
  filters?: Omit<AnimeListParams, 'page' | 'page_size'>
}

/** 从后端分页拉取并转为 AnimationNode（支持渐进批次） */
export async function loadAnimationNodes(
  options: LoadAnimationNodesOptions = {},
): Promise<AnimationNode[]> {
  const dictionary =
    options.themeDictionary ?? buildThemeDictionary(await fetchThemes())

  const fetchOptions: FetchAllAnimeOptions = {
    signal: options.signal,
    filters: options.filters ?? {},
    onProgress: options.onProgress,
    onBatch: options.onBatch
      ? (items) => {
          void animeItemsToNodesAsync(items, dictionary).then((nodes) => {
            if (nodes.length > 0) options.onBatch?.(nodes)
          })
        }
      : undefined,
  }

  const items = await fetchAllAnimeItems(fetchOptions)
  return animeItemsToNodesAsync(items, dictionary)
}

import animationDataUrl from '@/data/animationData.json?url'
import { tmdbRecordsToNodes } from '@/lib/tmdbToNode'
import type { AnimationNode } from '@/types'
import type { TmdbAnimeRecord } from '@/types/tmdb'

/** 从 animationData.json（TMDB 原始结构）加载并转为 AnimationNode */
export async function loadAnimationNodes(): Promise<AnimationNode[]> {
  const res = await fetch(animationDataUrl)
  if (!res.ok) {
    throw new Error(`无法加载 animationData.json (${res.status})`)
  }
  const raw = (await res.json()) as TmdbAnimeRecord[]
  if (!Array.isArray(raw)) {
    throw new Error('animationData.json 格式无效：应为数组')
  }
  return tmdbRecordsToNodes(raw)
}

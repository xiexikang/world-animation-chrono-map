import { useEffect, useState } from 'react'
import { fetchAnimeDetail } from '@/api/anime'
import { ApiError } from '@/api/http'
import { animeItemToNode } from '@/lib/nodes'
import { parseAnimeNodeKeys } from '@/lib/parseAnimeNodeKeys'
import { buildThemeDictionary } from '@/lib/themeDictionary'
import { useAppStore } from '@/store'
import type { AnimationNode } from '@/types'

export type AnimeDetailStatus = 'idle' | 'loading' | 'ready' | 'not_found' | 'error'

function mergeDetailNode(seed: AnimationNode, detailed: AnimationNode): AnimationNode {
  return {
    ...detailed,
    externalUrl: seed.externalUrl ?? detailed.externalUrl,
  }
}

/** 打开详情时拉取 GET /api/animes/{tmdb_id}/{country_code}，失败时保留列表节点 */
export function useAnimeDetailNode(seed: AnimationNode) {
  const [node, setNode] = useState(seed)
  const [status, setStatus] = useState<AnimeDetailStatus>('idle')

  useEffect(() => {
    setNode(seed)

    const keys = parseAnimeNodeKeys(seed)
    if (!keys) {
      setStatus('idle')
      return
    }

    const controller = new AbortController()
    let cancelled = false
    setStatus('loading')

    fetchAnimeDetail(keys.tmdbId, keys.countryCode, controller.signal)
      .then((item) => {
        if (cancelled) return
        const { themeItems } = useAppStore.getState()
        const detailed = animeItemToNode(item, buildThemeDictionary(themeItems))
        if (detailed) {
          setNode(mergeDetailNode(seed, detailed))
          setStatus('ready')
        } else {
          setStatus('error')
        }
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return
        if (err instanceof ApiError && err.status === 404) {
          setStatus('not_found')
          return
        }
        setStatus('error')
      })

    return () => {
      cancelled = true
      controller.abort()
    }
    // 仅随作品 id 拉取；主题在 then 内读取，避免 themeItems 引用变化触发二次请求
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed 与 seed.id 同步切换
  }, [seed.id])

  return { node, status }
}

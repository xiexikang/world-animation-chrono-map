import type { AnimationNode } from '@/types'

/** 从节点 id / countryCode 解析详情接口所需主键 */
export function parseAnimeNodeKeys(
  node: AnimationNode,
): { tmdbId: number; countryCode: string } | null {
  const match = /^tmdb-(\d+)(?:-([A-Za-z]{2}))?$/i.exec(node.id)
  if (!match) return null

  const tmdbId = Number(match[1])
  const countryCode = (match[2] ?? node.countryCode)?.toUpperCase()
  if (!Number.isFinite(tmdbId) || !countryCode) return null

  return { tmdbId, countryCode }
}

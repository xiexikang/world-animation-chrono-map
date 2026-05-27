import { nodeMatchesSourceCountry } from '@/lib/sourceCountry'
import { sortNodesByDate } from '@/lib/sortNodes'
import type { AnimationNode } from '@/types'

/** 按 id 合并节点，新数据覆盖同 id 旧数据 */
export function mergeNodesById(
  existing: AnimationNode[],
  incoming: AnimationNode[],
): AnimationNode[] {
  if (incoming.length === 0) return existing
  const map = new Map(existing.map((n) => [n.id, n]))
  for (const node of incoming) {
    map.set(node.id, node)
  }
  return sortNodesByDate([...map.values()])
}

/** 替换某一国家（或全球）分片后合并新节点 */
export function replaceCountryNodes(
  existing: AnimationNode[],
  countryCode: string | undefined,
  incoming: AnimationNode[],
  isFirstBatch: boolean,
): AnimationNode[] {
  let base = existing
  if (isFirstBatch) {
    base = countryCode
      ? existing.filter((n) => !nodeMatchesSourceCountry(n, countryCode))
      : []
  }
  return mergeNodesById(base, incoming)
}

export function storeHasCountryScope(
  nodes: AnimationNode[],
  scope: string,
): boolean {
  if (scope === '__ALL__') {
    return nodes.length > 0
  }
  return nodes.some((n) => nodeMatchesSourceCountry(n, scope))
}

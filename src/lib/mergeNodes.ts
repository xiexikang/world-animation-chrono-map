import { nodeMatchesSourceCountry } from '@/lib/sourceCountry'
import { sortNodesByDate } from '@/lib/sortNodes'
import type { AnimationNode } from '@/types'

export interface MergeNodesOptions {
  /** 默认 true；分页加载过程中可设为 false，最后统一排序 */
  sort?: boolean
}

/** 按 id 合并节点，新数据覆盖同 id 旧数据 */
export function mergeNodesById(
  existing: AnimationNode[],
  incoming: AnimationNode[],
  options?: MergeNodesOptions,
): AnimationNode[] {
  if (incoming.length === 0) return existing
  const map = new Map(existing.map((n) => [n.id, n]))
  for (const node of incoming) {
    map.set(node.id, node)
  }
  const merged = [...map.values()]
  return options?.sort === false ? merged : sortNodesByDate(merged)
}

/** 替换某一国家（或全球）分片后合并新节点 */
export function replaceCountryNodes(
  existing: AnimationNode[],
  countryCode: string | undefined,
  incoming: AnimationNode[],
  isFirstBatch: boolean,
  options?: MergeNodesOptions,
): AnimationNode[] {
  let base = existing
  if (isFirstBatch) {
    base = countryCode
      ? existing.filter((n) => !nodeMatchesSourceCountry(n, countryCode))
      : []
  }
  return mergeNodesById(base, incoming, options)
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

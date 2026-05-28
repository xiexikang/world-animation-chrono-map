import type { AnimationNode } from '@/types'

const ERA_YEAR: Record<string, number> = {
  '60': 1960,
  '70': 1970,
  '80': 1980,
  '90': 1990,
  '00': 2000,
  '10': 2010,
  '20': 2020,
}

/** 用于排序的年份（优先 year，其次 era 映射；无年份返回 null） */
export function nodeYear(node: AnimationNode): number | null {
  if (node.year != null && Number.isFinite(node.year)) return node.year
  const eraYear = ERA_YEAR[node.era]
  return eraYear ?? null
}

/** 无年份条目始终排在末尾 */
function sortableYear(node: AnimationNode): number {
  return nodeYear(node) ?? -1
}

/** 按时间从新到旧；同年按 id 降序 */
export function compareNodesByDate(a: AnimationNode, b: AnimationNode): number {
  const yearDiff = sortableYear(b) - sortableYear(a)
  if (yearDiff !== 0) return yearDiff
  return b.id.localeCompare(a.id, undefined, { numeric: true })
}

export function sortNodesByDate(nodes: AnimationNode[]): AnimationNode[] {
  return [...nodes].sort(compareNodesByDate)
}

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

/** 用于排序的年份（优先 year，其次 era 映射） */
export function nodeYear(node: AnimationNode): number {
  if (node.year != null && Number.isFinite(node.year)) return node.year
  return ERA_YEAR[node.era] ?? 9999
}

/** 按时间从早到晚；同年按 id */
export function compareNodesByDate(a: AnimationNode, b: AnimationNode): number {
  const yearDiff = nodeYear(a) - nodeYear(b)
  if (yearDiff !== 0) return yearDiff
  return a.id.localeCompare(b.id, undefined, { numeric: true })
}

export function sortNodesByDate(nodes: AnimationNode[]): AnimationNode[] {
  return [...nodes].sort(compareNodesByDate)
}

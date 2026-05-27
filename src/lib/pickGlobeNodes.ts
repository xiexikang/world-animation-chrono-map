import {
  DEFAULT_GLOBE_MARKERS,
  MAX_GLOBE_MARKERS_CAP,
} from '@/constants/performance'
import type { AnimationNode } from '@/types'

function compareForGlobe(a: AnimationNode, b: AnimationNode): number {
  const popA = a.popularity ?? 0
  const popB = b.popularity ?? 0
  if (popB !== popA) return popB - popA
  const yearA = a.year ?? 0
  const yearB = b.year ?? 0
  if (yearB !== yearA) return yearB - yearA
  return a.id.localeCompare(b.id, undefined, { numeric: true })
}

/** 从当前筛选结果中挑选地球上展示的作品（按热度优先） */
export function pickGlobeNodes(
  allNodes: AnimationNode[],
  visibleIds: Set<string>,
  focusedId: string | null,
  markerLimit = DEFAULT_GLOBE_MARKERS,
): AnimationNode[] {
  const limit = Math.min(Math.max(markerLimit, 1), MAX_GLOBE_MARKERS_CAP)
  const visible = allNodes.filter((n) => visibleIds.has(n.id))
  if (visible.length === 0) return []

  const picked: AnimationNode[] = []
  const seen = new Set<string>()

  const push = (node: AnimationNode | undefined) => {
    if (!node || seen.has(node.id) || picked.length >= limit) return
    seen.add(node.id)
    picked.push(node)
  }

  if (focusedId) {
    push(allNodes.find((n) => n.id === focusedId))
  }

  const sorted = [...visible].sort(compareForGlobe)
  for (const node of sorted) {
    push(node)
    if (picked.length >= limit) break
  }

  return picked
}

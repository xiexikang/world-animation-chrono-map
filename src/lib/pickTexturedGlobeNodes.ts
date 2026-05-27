import type { AnimationNode } from '@/types'

/** 优先加载海报纹理的节点（聚焦 + 前 N 个） */
export function pickTexturedGlobeNodes(
  nodes: AnimationNode[],
  focusedId: string | null,
  maxTextured = 40,
): AnimationNode[] {
  const focused = focusedId
    ? nodes.find((n) => n.id === focusedId)
    : undefined
  const rest = nodes.filter((n) => n.id !== focusedId)
  const picked = rest.slice(0, Math.max(0, maxTextured - (focused ? 1 : 0)))
  return focused ? [focused, ...picked] : picked
}

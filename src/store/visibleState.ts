import { computeVisibleIds, nodeMatchesVisibleFilters } from '@/store/visibleIds'
import type { AnimationNode } from '@/types'

export function appendVisibleIdsForNodes(
  state: {
    visibleIds: Set<string>
    era: string
    themes: string[]
    countries: string[]
    searchQuery: string
  },
  nodes: AnimationNode[],
): Set<string> {
  const visibleIds = new Set(state.visibleIds)
  for (const node of nodes) {
    if (
      nodeMatchesVisibleFilters(
        node,
        state.era,
        state.themes,
        state.countries,
        state.searchQuery,
      )
    ) {
      visibleIds.add(node.id)
    }
  }
  return visibleIds
}

export function buildVisibleState(state: {
  allNodes: AnimationNode[]
  era: string
  themes: string[]
  countries: string[]
  searchQuery: string
}) {
  const visibleIds = computeVisibleIds(
    state.allNodes,
    state.era,
    state.themes,
    state.countries,
    state.searchQuery,
  )
  return {
    visibleIds,
    visibleCount: visibleIds.size,
    nodeCount: state.allNodes.length,
  }
}

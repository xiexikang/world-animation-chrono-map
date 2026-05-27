import { nodeMatchesSourceCountry } from '@/lib/sourceCountry'
import type { AnimationNode } from '@/types'

export function nodeMatchesVisibleFilters(
  node: AnimationNode,
  era: string,
  themes: string[],
  countries: string[],
  searchQuery: string,
): boolean {
  const q = searchQuery.trim().toLowerCase()
  const eraMatch = era === 'all' || node.era === era
  const themeMatch =
    themes.length === 0 || themes.some((t) => node.themes.includes(t))
  const countryMatch =
    countries.length === 0 ||
    countries.some((code) => nodeMatchesSourceCountry(node, code))
  const searchMatch =
    q === '' ||
    node.title.toLowerCase().includes(q) ||
    (node.titleEn?.toLowerCase().includes(q) ?? false)
  return eraMatch && themeMatch && countryMatch && searchMatch
}

export function computeVisibleIds(
  allNodes: AnimationNode[],
  era: string,
  themes: string[],
  countries: string[],
  searchQuery: string,
): Set<string> {
  const ids = new Set<string>()

  for (const node of allNodes) {
    if (nodeMatchesVisibleFilters(node, era, themes, countries, searchQuery)) {
      ids.add(node.id)
    }
  }

  return ids
}

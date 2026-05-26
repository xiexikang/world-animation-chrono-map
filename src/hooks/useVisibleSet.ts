import { useMemo } from 'react'
import { useAppStore } from '@/store'

export function useVisibleSet(): Set<string> {
  const era = useAppStore((s) => s.era)
  const themes = useAppStore((s) => s.themes)
  const countries = useAppStore((s) => s.countries)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const allNodes = useAppStore((s) => s.allNodes)

  return useMemo(
    () => useAppStore.getState().getVisibleSet(),
    [era, themes, countries, searchQuery, allNodes],
  )
}

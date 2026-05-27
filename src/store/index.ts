import { create } from 'zustand'
import { nodeMatchesSourceCountry } from '@/lib/sourceCountry'
import { sortNodesByDate } from '@/lib/sortNodes'
import { tagThemeOptions } from '@/lib/themeDictionary'
import type { AnimationNode } from '@/types'
import type { CountryItem, ThemeItem } from '@/types/api'

export interface AppStore {
  allNodes: AnimationNode[]
  nodesLoaded: boolean

  countryCategories: CountryItem[]
  countryCategoriesLoaded: boolean

  themeItems: ThemeItem[]
  themeTagOptions: string[]
  themesLoaded: boolean

  era: string
  themes: string[]
  /** 选中的数据源国家码（/api/countries），空数组表示全部 */
  countries: string[]
  searchQuery: string

  zoom: number
  panX: number
  panY: number
  focusedId: string | null

  sidebarOpen: boolean
  detailCardId: string | null
  aboutOpen: boolean
  mobileThemeOpen: boolean

  setNodes: (nodes: AnimationNode[]) => void
  setCountryCategories: (categories: CountryItem[]) => void
  setThemeItems: (items: ThemeItem[]) => void
  setEra: (era: string) => void
  toggleTheme: (theme: string) => void
  toggleCountry: (code: string | 'ALL') => void
  setSearchQuery: (q: string) => void
  setFocusedId: (id: string | null) => void
  setDetailCard: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setAboutOpen: (open: boolean) => void
  setMobileThemeOpen: (open: boolean) => void
  setCanvasTransform: (zoom: number, panX: number, panY: number) => void
  resetFilters: () => void
  getVisibleSet: () => Set<string>
}

function matchesFilters(
  node: AnimationNode,
  era: string,
  themes: string[],
  countries: string[],
  searchQuery: string,
): boolean {
  const eraMatch = era === 'all' || node.era === era
  const themeMatch =
    themes.length === 0 || themes.some((t) => node.themes.includes(t))
  const countryMatch =
    countries.length === 0 ||
    countries.some((code) => nodeMatchesSourceCountry(node, code))
  const q = searchQuery.trim().toLowerCase()
  const searchMatch =
    q === '' ||
    node.title.toLowerCase().includes(q) ||
    (node.titleEn?.toLowerCase().includes(q) ?? false)
  return eraMatch && themeMatch && countryMatch && searchMatch
}

function defaultSelectedCountry(codes: string[]): string[] {
  if (codes.length === 0) return []
  if (codes.includes('CN')) return ['CN']
  return [codes[0]!]
}

export const useAppStore = create<AppStore>((set, get) => ({
  allNodes: [],
  nodesLoaded: false,

  countryCategories: [],
  countryCategoriesLoaded: false,

  themeItems: [],
  themeTagOptions: [],
  themesLoaded: false,

  era: 'all',
  themes: [],
  countries: ['CN'],
  searchQuery: '',

  zoom: 1,
  panX: 0,
  panY: 0,
  focusedId: null,

  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  detailCardId: null,
  aboutOpen: false,
  mobileThemeOpen: false,

  setNodes: (nodes) =>
    set({ allNodes: sortNodesByDate(nodes), nodesLoaded: true }),

  setThemeItems: (items) =>
    set({
      themeItems: items,
      themeTagOptions: tagThemeOptions(items),
      themesLoaded: true,
    }),

  setCountryCategories: (categories) => {
    const codes = categories.map((c) => c.code)
    const current = get().countries[0]
    const next =
      current && codes.includes(current)
        ? [current]
        : defaultSelectedCountry(codes)
    set({
      countryCategories: categories,
      countryCategoriesLoaded: true,
      countries: next,
    })
  },

  setEra: (era) => set({ era }),

  toggleTheme: (theme) =>
    set((state) => {
      if (theme === '全部主题') return { themes: [] }
      const exists = state.themes.includes(theme)
      return {
        themes: exists
          ? state.themes.filter((t) => t !== theme)
          : [...state.themes, theme],
      }
    }),

  /** 国家筛选为单选：ALL = 全部，否则仅选中一国 */
  toggleCountry: (code) =>
    set(() => {
      if (code === 'ALL') return { countries: [] }
      return { countries: [code] }
    }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setFocusedId: (focusedId) => set({ focusedId }),

  setDetailCard: (detailCardId) => set({ detailCardId }),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  setAboutOpen: (aboutOpen) => set({ aboutOpen }),

  setMobileThemeOpen: (mobileThemeOpen) => set({ mobileThemeOpen }),

  setCanvasTransform: (zoom, panX, panY) => set({ zoom, panX, panY }),

  resetFilters: () => {
    const codes = get().countryCategories.map((c) => c.code)
    set({
      era: 'all',
      themes: [],
      countries: defaultSelectedCountry(codes),
      searchQuery: '',
    })
  },

  getVisibleSet: () => {
    const { allNodes, era, themes, countries, searchQuery } = get()
    return new Set(
      allNodes
        .filter((n) => matchesFilters(n, era, themes, countries, searchQuery))
        .map((n) => n.id),
    )
  },
}))

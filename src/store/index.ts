import { create } from 'zustand'
import { scheduleLatLngForNodes } from '@/lib/nodeLatLngCache'
import {
  mergeNodesById,
  replaceCountryNodes,
  storeHasCountryScope,
} from '@/lib/mergeNodes'
import { sortNodesByDate } from '@/lib/sortNodes'
import { tagThemeOptions } from '@/lib/themeDictionary'
import { appendVisibleIdsForNodes, buildVisibleState } from '@/store/visibleState'
import {
  DEFAULT_GLOBE_MARKERS,
  MAX_GLOBE_MARKERS_CAP,
} from '@/constants/performance'
import type { AnimationNode } from '@/types'
import type { CountryItem, ThemeItem } from '@/types/api'

export { storeHasCountryScope }

export interface AppStore {
  allNodes: AnimationNode[]
  nodesLoaded: boolean
  nodesSyncing: boolean
  nodesLoadProgress: { loaded: number; total: number | null } | null
  globeMarkerLimit: number

  visibleIds: Set<string>
  visibleCount: number
  nodeCount: number
  /** 落点缓存更新时递增，供地球组件刷新 */
  latLngCacheVersion: number

  countryCategories: CountryItem[]
  countryCategoriesLoaded: boolean
  countryStats: Map<string, number>
  countryStatsLoaded: boolean
  loadedCountryScopes: Set<string>

  themeItems: ThemeItem[]
  themeTagOptions: string[]
  themesLoaded: boolean

  era: string
  themes: string[]
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
  mergeNodes: (nodes: AnimationNode[]) => void
  applyCountryNodeBatch: (
    countryCode: string | undefined,
    nodes: AnimationNode[],
    isFirstBatch: boolean,
    options?: { sort?: boolean; skipVisible?: boolean },
  ) => void
  finalizeCountryNodesSort: () => void
  markCountryScopeLoaded: (scope: string) => void
  bumpLatLngCache: () => void
  beginNodesLoad: () => void
  beginCountryLoad: () => void
  setCountryStats: (stats: Map<string, number>) => void
  setNodesSyncing: (syncing: boolean) => void
  setNodesLoadProgress: (
    progress: { loaded: number; total: number | null } | null,
  ) => void
  setGlobeMarkerLimit: (limit: number) => void
  resetGlobeMarkerLimit: () => void
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
}

function defaultSelectedCountry(codes: string[]): string[] {
  if (codes.length === 0) return []
  if (codes.includes('CN')) return ['CN']
  return [codes[0]!]
}

function patchVisible(state: AppStore, extra: Partial<AppStore> = {}) {
  const merged = { ...state, ...extra }
  return { ...merged, ...buildVisibleState(merged) }
}

export const useAppStore = create<AppStore>((set, get) => ({
  allNodes: [],
  nodesLoaded: false,
  nodesSyncing: false,
  nodesLoadProgress: null,
  globeMarkerLimit: DEFAULT_GLOBE_MARKERS,

  visibleIds: new Set(),
  visibleCount: 0,
  nodeCount: 0,
  latLngCacheVersion: 0,

  countryCategories: [],
  countryCategoriesLoaded: false,
  countryStats: new Map(),
  countryStatsLoaded: false,
  loadedCountryScopes: new Set(),

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

  bumpLatLngCache: () =>
    set((state) => ({ latLngCacheVersion: state.latLngCacheVersion + 1 })),

  beginNodesLoad: () =>
    set({ nodesLoaded: false, nodesSyncing: true, nodesLoadProgress: null }),

  beginCountryLoad: () =>
    set((state) => ({
      nodesSyncing: true,
      nodesLoadProgress: null,
      nodesLoaded: state.allNodes.length > 0 ? state.nodesLoaded : false,
    })),

  setNodesSyncing: (nodesSyncing) => set({ nodesSyncing }),

  setNodesLoadProgress: (nodesLoadProgress) => set({ nodesLoadProgress }),

  setGlobeMarkerLimit: (limit) =>
    set({
      globeMarkerLimit: Math.min(
        MAX_GLOBE_MARKERS_CAP,
        Math.max(DEFAULT_GLOBE_MARKERS, limit),
      ),
    }),

  resetGlobeMarkerLimit: () =>
    set({ globeMarkerLimit: DEFAULT_GLOBE_MARKERS }),

  setNodes: (nodes) => {
    scheduleLatLngForNodes(
      [...nodes]
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, 100),
    )
    set((state) =>
      patchVisible(state, {
        allNodes: sortNodesByDate(nodes),
        nodesLoaded: true,
      }),
    )
  },

  mergeNodes: (nodes) => {
    scheduleLatLngForNodes(
      [...nodes]
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, 50),
    )
    set((state) =>
      patchVisible(state, {
        allNodes: mergeNodesById(state.allNodes, nodes),
        nodesLoaded: true,
      }),
    )
  },

  applyCountryNodeBatch: (countryCode, nodes, isFirstBatch, options) => {
    const topForGeo = [...nodes]
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 50)
    scheduleLatLngForNodes(topForGeo)
    set((state) => {
      const allNodes = replaceCountryNodes(
        state.allNodes,
        countryCode,
        nodes,
        isFirstBatch,
        { sort: options?.sort === true },
      )
      if (options?.skipVisible) {
        return {
          allNodes,
          nodesLoaded: true,
          nodeCount: allNodes.length,
        }
      }
      if (isFirstBatch || !state.nodesSyncing) {
        return patchVisible(state, {
          allNodes,
          nodesLoaded: true,
        })
      }
      const visibleIds = appendVisibleIdsForNodes(state, nodes)
      return {
        allNodes,
        nodesLoaded: true,
        visibleIds,
        visibleCount: visibleIds.size,
        nodeCount: allNodes.length,
      }
    })
  },

  finalizeCountryNodesSort: () =>
    set((state) =>
      patchVisible(state, {
        allNodes: sortNodesByDate(state.allNodes),
        nodesLoaded: true,
      }),
    ),

  markCountryScopeLoaded: (scope) =>
    set((state) => {
      const next = new Set(state.loadedCountryScopes)
      next.add(scope)
      return { loadedCountryScopes: next }
    }),

  setCountryStats: (countryStats) =>
    set({ countryStats, countryStatsLoaded: true }),

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
    set((state) =>
      patchVisible(state, {
        countryCategories: categories,
        countryCategoriesLoaded: true,
        countries: next,
      }),
    )
  },

  setEra: (era) => set((state) => patchVisible(state, { era })),

  toggleTheme: (theme) =>
    set((state) => {
      if (theme === '全部主题') {
        return patchVisible(state, { themes: [] })
      }
      const exists = state.themes.includes(theme)
      return patchVisible(state, {
        themes: exists
          ? state.themes.filter((t) => t !== theme)
          : [...state.themes, theme],
      })
    }),

  toggleCountry: (code) =>
    set((state) => {
      const countries = code === 'ALL' ? [] : [code]
      return patchVisible(state, { countries })
    }),

  setSearchQuery: (searchQuery) =>
    set((state) => patchVisible(state, { searchQuery })),

  setFocusedId: (focusedId) => set({ focusedId }),

  setDetailCard: (detailCardId) => set({ detailCardId }),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  setAboutOpen: (aboutOpen) => set({ aboutOpen }),

  setMobileThemeOpen: (mobileThemeOpen) => set({ mobileThemeOpen }),

  setCanvasTransform: (zoom, panX, panY) => set({ zoom, panX, panY }),

  resetFilters: () => {
    const codes = get().countryCategories.map((c) => c.code)
    set((state) =>
      patchVisible(state, {
        era: 'all',
        themes: [],
        countries: defaultSelectedCountry(codes),
        searchQuery: '',
        globeMarkerLimit: DEFAULT_GLOBE_MARKERS,
      }),
    )
  },
}))

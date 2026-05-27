import { buildAnimeFetchFilters, countryScopeKey } from '@/lib/animeListFilters'
import { loadAnimeWithCache } from '@/lib/loadAnimeWithCache'
import { storeHasCountryScope } from '@/lib/mergeNodes'
import type { ThemeDictionary } from '@/lib/themeDictionary'
import { buildVisibleState } from '@/store/visibleState'
import { useAppStore } from '@/store'

export interface LoadCountryScopeOptions {
  countryCode?: string
  themeDictionary: ThemeDictionary
  signal?: AbortSignal
  /** 预拉取：不占用顶栏同步进度 */
  silent?: boolean
}

export function isCountryScopeReady(scope: string): boolean {
  const state = useAppStore.getState()
  return (
    state.loadedCountryScopes.has(scope) ||
    (scope !== '__ALL__' && storeHasCountryScope(state.allNodes, scope))
  )
}

/** 拉取单一国家（或全球）分片并写入 store */
export async function loadCountryScope(
  options: LoadCountryScopeOptions,
): Promise<boolean> {
  const { countryCode, themeDictionary, signal, silent = false } = options
  const scope = countryScopeKey(
    countryCode ? [countryCode] : [],
  )
  const fetchFilters = buildAnimeFetchFilters(countryCode)

  if (isCountryScopeReady(scope)) {
    const state = useAppStore.getState()
    if (!state.nodesLoaded) {
      useAppStore.setState({ nodesLoaded: true })
    }
    if (!state.loadedCountryScopes.has(scope)) {
      state.markCountryScopeLoaded(scope)
    }
    return false
  }

  const store = useAppStore.getState()
  if (store.allNodes.length === 0) {
    store.beginNodesLoad()
  } else if (!silent) {
    store.beginCountryLoad()
  }

  let firstBatch = true

  try {
    await loadAnimeWithCache({
      signal,
      filters: fetchFilters,
      themeDictionary,
      onCacheHydrate: (nodes, willRefresh) => {
        if (signal?.aborted) return
        useAppStore
          .getState()
          .applyCountryNodeBatch(countryCode, nodes, true, {
            sort: false,
            skipVisible: silent,
          })
        firstBatch = false
        if (willRefresh && !silent) {
          useAppStore.getState().setNodesSyncing(true)
        }
      },
      onProgress: (loaded, total) => {
        if (signal?.aborted || silent) return
        useAppStore.getState().setNodesLoadProgress({ loaded, total })
      },
      onBatch: (batch) => {
        if (signal?.aborted || batch.length === 0) return
        if (!silent) useAppStore.getState().setNodesSyncing(true)
        useAppStore
          .getState()
          .applyCountryNodeBatch(countryCode, batch, firstBatch, {
            sort: false,
            skipVisible: silent,
          })
        firstBatch = false
      },
    })

    if (signal?.aborted) return false

    useAppStore.getState().finalizeCountryNodesSort()
    if (silent) {
      useAppStore.setState((state) => ({
        ...buildVisibleState(state),
      }))
    }
    useAppStore.getState().markCountryScopeLoaded(scope)
    return true
  } catch (err) {
    if (signal?.aborted) return false
    throw err
  } finally {
    if (!signal?.aborted && !silent) {
      const s = useAppStore.getState()
      s.setNodesSyncing(false)
      s.setNodesLoadProgress(null)
    }
  }
}

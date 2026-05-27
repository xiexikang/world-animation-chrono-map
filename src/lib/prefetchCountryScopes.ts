import {
  PREFETCH_FALLBACK_DELAY_MS,
  PREFETCH_IDLE_TIMEOUT_MS,
} from '@/constants/prefetch'
import { COUNTRY_PREFETCH_ENABLED } from '@/config'
import { loadCountryScope } from '@/lib/loadCountryScope'
import { buildThemeDictionary } from '@/lib/themeDictionary'
import { useAppStore } from '@/store'

let prefetchRunId = 0
let idleHandle: number | null = null
let timeoutHandle: ReturnType<typeof setTimeout> | null = null

function clearPrefetchSchedule() {
  if (idleHandle != null && typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(idleHandle)
    idleHandle = null
  }
  if (timeoutHandle != null) {
    clearTimeout(timeoutHandle)
    timeoutHandle = null
  }
}

/**
 * 根据 /api/countries/stats 与分类列表，生成待预拉国家（排除当前国、已加载、无数据）。
 * 按作品数量降序，优先拉数据量大的国家。
 */
export function resolvePrefetchCountryCodes(excludeCode?: string): string[] {
  if (!COUNTRY_PREFETCH_ENABLED) return []

  const state = useAppStore.getState()
  if (state.countries.length === 0) return []

  const exclude = excludeCode?.toUpperCase()
  const baseCodes = state.countryCategoriesLoaded
    ? state.countryCategories.map((c) => c.code)
    : [...state.countryStats.keys()]

  const candidates = baseCodes.filter((code) => {
    if (code === exclude) return false
    if (state.loadedCountryScopes.has(code)) return false
    if (state.countryStatsLoaded && (state.countryStats.get(code) ?? 0) <= 0) {
      return false
    }
    return true
  })

  if (!state.countryStatsLoaded) {
    return candidates
  }

  return [...candidates].sort(
    (a, b) => (state.countryStats.get(b) ?? 0) - (state.countryStats.get(a) ?? 0),
  )
}

async function runPrefetchQueue(runId: number, codes: string[]) {
  const state = useAppStore.getState()
  if (!state.themesLoaded || state.themeItems.length === 0) return

  const themeDictionary = buildThemeDictionary(state.themeItems)

  for (const code of codes) {
    if (runId !== prefetchRunId) return
    if (useAppStore.getState().loadedCountryScopes.has(code)) continue

    try {
      await loadCountryScope({
        countryCode: code,
        themeDictionary,
        silent: true,
      })
    } catch (err) {
      console.warn(`[prefetch] ${code} 预拉取失败`, err)
    }
  }
}

/**
 * 在当前国（默认 CN）加载完成后，空闲时按 stats 预拉其余国家（不阻塞 UI）。
 */
export function scheduleCountryPrefetch(excludeCode?: string) {
  if (!COUNTRY_PREFETCH_ENABLED) return

  clearPrefetchSchedule()

  const codes = resolvePrefetchCountryCodes(excludeCode)
  if (codes.length === 0) return

  const runId = ++prefetchRunId

  const start = () => {
    idleHandle = null
    timeoutHandle = null
    void runPrefetchQueue(runId, codes)
  }

  if (typeof requestIdleCallback === 'function') {
    idleHandle = requestIdleCallback(start, { timeout: PREFETCH_IDLE_TIMEOUT_MS })
  } else {
    timeoutHandle = setTimeout(start, PREFETCH_FALLBACK_DELAY_MS)
  }
}

export function cancelCountryPrefetch() {
  prefetchRunId += 1
  clearPrefetchSchedule()
}

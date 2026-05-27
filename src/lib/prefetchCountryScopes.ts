import {
  PREFETCH_COUNTRY_CODES,
  PREFETCH_FALLBACK_DELAY_MS,
  PREFETCH_IDLE_TIMEOUT_MS,
} from '@/constants/prefetch'
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

function prefetchCandidates(excludeCode?: string): string[] {
  const state = useAppStore.getState()
  if (state.countries.length === 0) return []

  return PREFETCH_COUNTRY_CODES.filter((code) => {
    if (code === excludeCode) return false
    return !state.loadedCountryScopes.has(code)
  })
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
 * 在当前国加载完成后，空闲时按顺序预拉 JP / US（不阻塞 UI）。
 */
export function scheduleCountryPrefetch(excludeCode?: string) {
  clearPrefetchSchedule()

  const codes = prefetchCandidates(excludeCode)
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

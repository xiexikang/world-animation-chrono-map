import { useEffect, useState } from 'react'
import { AboutModal } from '@/components/AboutModal'
import { CountryPanel } from '@/components/CountryPanel'
import { DetailCard } from '@/components/DetailCard'
import { GlobeWrapper } from '@/components/GlobeWrapper'
import { Sidebar } from '@/components/Sidebar'
import { ThemeDrawer, ThemeDrawerTrigger } from '@/components/ThemeDrawer'
import { Timeline } from '@/components/Timeline'
import { TopBar } from '@/components/TopBar'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { fetchCountries, fetchCountryStats } from '@/api/country'
import { fetchThemes } from '@/api/theme'
import { countryScopeKey } from '@/lib/animeListFilters'
import {
  isCountryScopeReady,
  loadCountryScope,
} from '@/lib/loadCountryScope'
import {
  cancelCountryPrefetch,
  scheduleCountryPrefetch,
} from '@/lib/prefetchCountryScopes'
import { onLatLngCacheReady } from '@/lib/nodeLatLngCache'
import { buildThemeDictionary } from '@/lib/themeDictionary'
import { useAppStore } from '@/store'

function App() {
  const nodesLoaded = useAppStore((s) => s.nodesLoaded)
  const nodesSyncing = useAppStore((s) => s.nodesSyncing)
  const nodesLoadProgress = useAppStore((s) => s.nodesLoadProgress)
  const countries = useAppStore((s) => s.countries)
  const themeItems = useAppStore((s) => s.themeItems)
  const themesLoaded = useAppStore((s) => s.themesLoaded)
  const countryCategoriesLoaded = useAppStore(
    (s) => s.countryCategoriesLoaded,
  )
  const countryStatsLoaded = useAppStore((s) => s.countryStatsLoaded)
  const setCountryCategories = useAppStore((s) => s.setCountryCategories)
  const setCountryStats = useAppStore((s) => s.setCountryStats)
  const setThemeItems = useAppStore((s) => s.setThemeItems)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 768px)')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    return onLatLngCacheReady(() => {
      useAppStore.getState().bumpLatLngCache()
    })
  }, [])

  useEffect(() => {
    if (countryCategoriesLoaded && themesLoaded) return

    let cancelled = false

    void Promise.all([fetchCountries(), fetchThemes(), fetchCountryStats()])
      .then(([countryList, themeList, stats]) => {
        if (cancelled) return
        setCountryCategories(countryList)
        setThemeItems(themeList)
        setCountryStats(stats)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : '加载分类数据失败'
        setLoadError(message)
        console.error('加载分类数据失败:', err)
      })

    return () => {
      cancelled = true
    }
  }, [
    countryCategoriesLoaded,
    themesLoaded,
    setCountryCategories,
    setThemeItems,
    setCountryStats,
  ])

  useEffect(() => {
    if (!themesLoaded || themeItems.length === 0) return

    const scope = countryScopeKey(countries)
    const countryCode = countries.length === 1 ? countries[0] : undefined
    const controller = new AbortController()
    let cancelled = false

    if (isCountryScopeReady(scope)) {
      const state = useAppStore.getState()
      if (!state.nodesLoaded) {
        useAppStore.setState({ nodesLoaded: true })
      }
      if (!state.loadedCountryScopes.has(scope)) {
        state.markCountryScopeLoaded(scope)
      }
      scheduleCountryPrefetch(countryCode)
      return () => {
        cancelCountryPrefetch()
      }
    }

    async function loadNodes() {
      setLoadError(null)

      try {
        const themeDictionary = buildThemeDictionary(themeItems)
        await loadCountryScope({
          countryCode,
          themeDictionary,
          signal: controller.signal,
        })
        if (!cancelled) {
          scheduleCountryPrefetch(countryCode)
        }
      } catch (err) {
        if (cancelled || controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : '加载动画数据失败'
        setLoadError(message)
        console.error('加载动画数据失败:', err)
      }
    }

    void loadNodes()

    return () => {
      cancelled = true
      controller.abort()
      cancelCountryPrefetch()
    }
  }, [countries, themeItems, themesLoaded])

  /** stats 晚于首屏国家就绪时补一次预拉调度 */
  useEffect(() => {
    if (!useAppStore.getState().countryStatsLoaded || !themesLoaded) return

    const scope = countryScopeKey(countries)
    if (!isCountryScopeReady(scope)) return

    const countryCode = countries.length === 1 ? countries[0] : undefined
    scheduleCountryPrefetch(countryCode)
  }, [countryStatsLoaded, themesLoaded, countries])

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true)
    } else {
      setSidebarOpen(false)
    }
  }, [isDesktop, isTablet, setSidebarOpen])

  const selectedCountry = countries.length === 1 ? countries[0] : null
  const showBootOverlay = !nodesLoaded
  const bootProgress = showBootOverlay ? nodesLoadProgress : null

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg text-text">
      <div className="fixed inset-0 z-0">
        <GlobeWrapper />

        {showBootOverlay ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-bg/55 px-6 text-center text-sm text-text-muted backdrop-blur-[2px]">
            {loadError ? (
              <>
                <p className="pointer-events-auto text-accent">无法连接后端</p>
                <p className="pointer-events-auto max-w-md text-xs leading-relaxed">
                  {loadError}
                </p>
                <p className="text-xs opacity-80">
                  请确认后端已启动（默认 http://127.0.0.1:8110）
                </p>
              </>
            ) : (
              <>
                <p>
                  {selectedCountry
                    ? `加载${selectedCountry}动画数据…`
                    : '加载全球动画数据…'}
                </p>
                {bootProgress?.total != null && bootProgress.total > 0 ? (
                  <p className="text-xs opacity-80">
                    {bootProgress.loaded} / {bootProgress.total}
                  </p>
                ) : bootProgress != null && bootProgress.loaded > 0 ? (
                  <p className="text-xs opacity-80">
                    已加载 {bootProgress.loaded} 条
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>

      <TopBar />
      <Sidebar />
      <CountryPanel />
      <Timeline />

      <ThemeDrawerTrigger />
      <DetailCard />
      <ThemeDrawer />
      <AboutModal />

      {nodesLoaded && nodesSyncing && nodesLoadProgress?.total ? (
        <span className="sr-only" aria-live="polite">
          正在同步 {nodesLoadProgress.loaded} / {nodesLoadProgress.total}
        </span>
      ) : null}
    </div>
  )
}

export default App

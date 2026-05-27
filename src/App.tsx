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
import { loadAnimationNodes } from '@/lib/loadAnimationData'
import { loadCountryCategories } from '@/lib/loadCountryCategories'
import { useAppStore } from '@/store'

function App() {
  const allNodes = useAppStore((s) => s.allNodes)
  const nodesLoaded = useAppStore((s) => s.nodesLoaded)
  const setNodes = useAppStore((s) => s.setNodes)
  const setCountryCategories = useAppStore((s) => s.setCountryCategories)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 768px)')
  const [loadProgress, setLoadProgress] = useState<{
    loaded: number
    total: number | null
  } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setLoadError(null)
    setLoadProgress(null)
    void loadCountryCategories()
      .then(setCountryCategories)
      .catch((err) => console.error('加载国家分类失败:', err))

    loadAnimationNodes((loaded, total) => setLoadProgress({ loaded, total }))
      .then(setNodes)
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : '加载动画数据失败'
        setLoadError(message)
        console.error('加载动画数据失败:', err)
      })
  }, [setNodes, setCountryCategories])

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true)
    } else {
      setSidebarOpen(false)
    }
  }, [isDesktop, isTablet, setSidebarOpen])

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg text-text">
      <div className="fixed inset-0 z-0">
        {!nodesLoaded ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-text-muted">
            {loadError ? (
              <>
                <p className="text-accent">无法连接后端</p>
                <p className="max-w-md text-xs leading-relaxed">{loadError}</p>
                <p className="text-xs opacity-80">
                  请确认后端已启动（默认 http://127.0.0.1:8110），或设置
                  VITE_USE_STATIC_DATA=true 使用本地 JSON
                </p>
              </>
            ) : (
              <>
                <p>加载动画数据…</p>
                {loadProgress?.total != null && loadProgress.total > 0 ? (
                  <p className="text-xs opacity-80">
                    {loadProgress.loaded} / {loadProgress.total}
                  </p>
                ) : loadProgress != null && loadProgress.loaded > 0 ? (
                  <p className="text-xs opacity-80">已加载 {loadProgress.loaded} 条</p>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <GlobeWrapper nodes={allNodes} />
        )}
      </div>

      <TopBar />
      <Sidebar />
      <CountryPanel />
      <Timeline />

      <ThemeDrawerTrigger />
      <DetailCard />
      <ThemeDrawer />
      <AboutModal />
    </div>
  )
}

export default App

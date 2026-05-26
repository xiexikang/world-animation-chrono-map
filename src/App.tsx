import { useEffect } from 'react'
import { AboutModal } from '@/components/AboutModal'
import { CountryPanel } from '@/components/CountryPanel'
import { DetailCard } from '@/components/DetailCard'
import { GlobeWrapper } from '@/components/GlobeWrapper'
import { Sidebar } from '@/components/Sidebar'
import { ThemeDrawer, ThemeDrawerTrigger } from '@/components/ThemeDrawer'
import { Timeline } from '@/components/Timeline'
import { TopBar } from '@/components/TopBar'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useAppStore } from '@/store'
import type { AnimationNode } from '@/types'

function App() {
  const allNodes = useAppStore((s) => s.allNodes)
  const nodesLoaded = useAppStore((s) => s.nodesLoaded)
  const setNodes = useAppStore((s) => s.setNodes)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    fetch('/data/nodes.json')
      .then((res) => res.json())
      .then((data: AnimationNode[]) => setNodes(data))
      .catch((err) => console.error('Failed to load nodes:', err))
  }, [setNodes])

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
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            加载世界地图…
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

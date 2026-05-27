import { MAX_GLOBE_MARKERS_CAP } from '@/constants/performance'
import { useVisibleSet } from '@/hooks/useVisibleSet'
import { canvasEmitter } from '@/lib/emitter'
import { pickGlobeNodes } from '@/lib/pickGlobeNodes'
import { useAppStore } from '@/store'
import { BackgroundLoadIndicator } from './BackgroundLoadIndicator'
import { SearchBox } from './SearchBox'

export function TopBar() {
  const total = useAppStore((s) => s.allNodes.length)
  const allNodes = useAppStore((s) => s.allNodes)
  const focusedId = useAppStore((s) => s.focusedId)
  const globeMarkerLimit = useAppStore((s) => s.globeMarkerLimit)
  const visibleSet = useVisibleSet()
  const visible = visibleSet.size
  const onGlobe = pickGlobeNodes(
    allNodes,
    visibleSet,
    focusedId,
    globeMarkerLimit,
  ).length

  return (
    <>
    <header className="float-panel fixed top-3 right-3 left-3 z-30 flex h-11 items-center gap-4 px-4 md:left-4 md:right-4">
      <div className="flex shrink-0 items-center gap-2 text-base font-bold text-accent">
        <span aria-hidden>🎬</span>
        <span className="max-md:hidden">世界动画地图</span>
        <span className="md:hidden">动画地图</span>
      </div>

      <div className="flex flex-1 justify-center">
        <SearchBox />
      </div>

      <p className="hidden shrink-0 text-xs text-text-muted sm:block">
        共 {total} 部 · 筛选 {visible} 部 · 地球 {onGlobe}/{globeMarkerLimit}
        {globeMarkerLimit < MAX_GLOBE_MARKERS_CAP && visible > globeMarkerLimit
          ? `（可加载更多）`
          : ''}
      </p>

      <button
        type="button"
        onClick={() => canvasEmitter.emit('canvas:reset')}
        className="shrink-0 rounded-lg px-2 py-1 text-xs text-text-muted transition hover:bg-white/10 hover:text-accent"
        title="复位视图"
        aria-label="复位视图"
      >
        <span className="max-sm:hidden">复位视图</span>
        <span className="sm:hidden">复位</span>
      </button>

      <button
        type="button"
        onClick={() => useAppStore.getState().setAboutOpen(true)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm text-text-muted transition hover:bg-white/10 hover:text-text"
        title="关于项目"
        aria-label="关于项目"
      >
        ?
      </button>
    </header>
    <BackgroundLoadIndicator />
    </>
  )
}

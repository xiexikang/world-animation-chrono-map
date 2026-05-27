import { useAppStore } from '@/store'

export function BackgroundLoadIndicator() {
  const syncing = useAppStore((s) => s.nodesSyncing)
  const progress = useAppStore((s) => s.nodesLoadProgress)

  if (!syncing) return null

  const total = progress?.total ?? 0
  const loaded = progress?.loaded ?? 0
  const pct =
    total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : null

  return (
    <div
      className="pointer-events-none fixed top-[3.65rem] right-3 left-3 z-[35] md:right-4 md:left-4"
      role="status"
      aria-live="polite"
      aria-label={
        total > 0 ? `后台同步 ${loaded} / ${total}` : '后台同步动画数据'
      }
    >
      <div className="glass-panel overflow-hidden rounded-full px-3 py-1.5">
        <div className="flex items-center justify-between gap-2 text-[10px] text-text-muted">
          <span>后台同步中</span>
          {total > 0 ? (
            <span>
              {loaded} / {total}
              {pct != null ? ` · ${pct}%` : ''}
            </span>
          ) : loaded > 0 ? (
            <span>已加载 {loaded} 条</span>
          ) : null}
        </div>
        <div
          className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/10"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: pct != null ? `${pct}%` : '30%' }}
          />
        </div>
      </div>
    </div>
  )
}

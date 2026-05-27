import { themeColor } from '@/constants'
import { useAppStore } from '@/store'

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const themes = useAppStore((s) => s.themes)
  const themeTagOptions = useAppStore((s) => s.themeTagOptions)
  const themesLoaded = useAppStore((s) => s.themesLoaded)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)

  const selectedCount = themes.length

  if (!sidebarOpen) {
    return (
      <aside className="float-panel fixed top-[4.25rem] left-3 z-30 hidden w-10 flex-col items-center gap-2 py-3 md:flex">
        <button
          type="button"
          className="text-text-muted hover:text-accent"
          onClick={() => setSidebarOpen(true)}
          aria-label="展开主题面板"
        >
          ›
        </button>
        {selectedCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
            {selectedCount}
          </span>
        )}
      </aside>
    )
  }

  return (
    <aside className="float-panel fixed top-[4.25rem] bottom-[4.75rem] left-3 z-30 hidden w-[180px] flex-col overflow-hidden md:flex">
      <div className="flex items-center justify-between px-3 py-3">
        <h2 className="text-sm font-semibold">主题</h2>
        <button
          type="button"
          className="text-text-muted hover:text-accent"
          onClick={() => setSidebarOpen(false)}
          aria-label="折叠主题面板"
        >
          ‹
        </button>
      </div>
      <nav className="panel-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-3 pr-1">
        <button
          type="button"
          onClick={() => toggleTheme('全部主题')}
          className={`flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
            themes.length === 0
              ? 'bg-white/10 text-text'
              : 'text-text-muted hover:bg-white/5 hover:text-text'
          }`}
          aria-pressed={themes.length === 0}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent"
            aria-hidden
          />
          <span>全部主题</span>
        </button>
        {!themesLoaded ? (
          <p className="px-2 py-4 text-xs text-text-muted">加载主题…</p>
        ) : null}
        {themeTagOptions.map((name) => {
          const active = themes.includes(name)
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggleTheme(name)}
              className={`flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                active
                  ? 'bg-white/10 text-text'
                  : 'text-text-muted hover:bg-white/5 hover:text-text'
              }`}
              aria-pressed={active}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: themeColor(name) }}
                aria-hidden
              />
              <span className="truncate">{name}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

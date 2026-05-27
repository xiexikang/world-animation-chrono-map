import { themeColor } from '@/constants'
import { useAppStore } from '@/store'

export function ThemeDrawer() {
  const open = useAppStore((s) => s.mobileThemeOpen)
  const setMobileThemeOpen = useAppStore((s) => s.setMobileThemeOpen)
  const themes = useAppStore((s) => s.themes)
  const themeTagOptions = useAppStore((s) => s.themeTagOptions)
  const themesLoaded = useAppStore((s) => s.themesLoaded)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        aria-label="关闭主题筛选"
        onClick={() => setMobileThemeOpen(false)}
      />
      <aside
        className="glass-panel fixed right-0 bottom-0 left-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl p-4 md:hidden"
        role="dialog"
        aria-labelledby="theme-drawer-title"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="theme-drawer-title" className="text-sm font-semibold">
            主题筛选
          </h2>
          <button
            type="button"
            className="text-text-muted"
            onClick={() => setMobileThemeOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => toggleTheme('全部主题')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
              themes.length === 0
                ? 'bg-accent/20 text-accent'
                : 'bg-white/5 text-text-muted'
            }`}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            全部主题
          </button>
          {!themesLoaded ? (
            <p className="col-span-2 py-4 text-center text-xs text-text-muted">
              加载主题…
            </p>
          ) : null}
          {themeTagOptions.map((name) => {
            const active = themes.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleTheme(name)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  active ? 'bg-accent/20 text-accent' : 'bg-white/5 text-text-muted'
                }`}
                aria-pressed={active}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: themeColor(name) }}
                  aria-hidden
                />
                {name}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export function ThemeDrawerTrigger() {
  const themes = useAppStore((s) => s.themes)
  const setMobileThemeOpen = useAppStore((s) => s.setMobileThemeOpen)

  return (
    <button
      type="button"
      onClick={() => setMobileThemeOpen(true)}
      className="float-panel fixed bottom-[10.5rem] left-3 z-30 flex items-center gap-2 px-3 py-2 text-xs md:hidden"
      aria-label="打开主题筛选"
    >
      主题
      {themes.length > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
          {themes.length}
        </span>
      )}
    </button>
  )
}

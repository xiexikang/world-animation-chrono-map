import { ERA_OPTIONS } from '@/constants'
import { useAppStore } from '@/store'

export function Timeline() {
  const era = useAppStore((s) => s.era)
  const setEra = useAppStore((s) => s.setEra)

  return (
    <footer className="float-panel fixed right-3 bottom-3 left-3 z-30 px-4 py-2.5 md:left-1/2 md:w-auto md:max-w-3xl md:-translate-x-1/2">
      <nav
        className="panel-scrollbar-x flex items-center justify-center gap-2 overflow-x-auto pb-1"
        aria-label="年代筛选"
        role="radiogroup"
      >
        {ERA_OPTIONS.map((option) => {
          const active = era === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setEra(option.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                active
                  ? 'bg-accent font-medium text-bg shadow-[0_0_10px_rgba(255,107,1,0.3)]'
                  : 'border border-white/10 bg-white/5 text-text-muted hover:bg-white/10 hover:text-text'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </nav>
    </footer>
  )
}

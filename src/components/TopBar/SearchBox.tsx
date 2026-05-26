import { useEffect, useRef } from 'react'
import { canvasEmitter } from '@/lib/emitter'
import { compareNodesByDate } from '@/lib/sortNodes'
import { useVisibleSet } from '@/hooks/useVisibleSet'
import { useAppStore } from '@/store'

export function SearchBox() {
  const searchQuery = useAppStore((s) => s.searchQuery)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const allNodes = useAppStore((s) => s.allNodes)
  const visibleSet = useVisibleSet()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasQuery = searchQuery.trim().length > 0
  const noResults = hasQuery && visibleSet.size === 0

  const handleChange = (value: string) => {
    setSearchQuery(value)
    const q = value.trim().toLowerCase()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q) return

    debounceRef.current = setTimeout(() => {
      const matches = allNodes
        .filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            (n.titleEn?.toLowerCase().includes(q) ?? false),
        )
        .sort(compareNodesByDate)
      const first = matches[0]
      if (first) canvasEmitter.emit('node:focus', first.id)
    }, 300)
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    [],
  )

  return (
    <div className="relative w-full max-w-[360px] lg:max-w-[400px]">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="搜索动画名称…"
        className="glass-panel h-9 w-full rounded-full px-4 text-sm text-text outline-none placeholder:text-text-muted focus:ring-2 focus:ring-accent/50"
        aria-label="搜索动画"
      />
      {searchQuery && (
        <button
          type="button"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-text-muted hover:text-text"
          onClick={() => setSearchQuery('')}
          aria-label="清空搜索"
        >
          ✕
        </button>
      )}
      {noResults && (
        <p className="absolute top-full left-0 mt-1 w-full text-center text-xs text-text-muted">
          未找到匹配动画
        </p>
      )}
    </div>
  )
}

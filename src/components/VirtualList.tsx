import { useCallback, useEffect, useRef, useState } from 'react'

interface VirtualListProps<T> {
  items: T[]
  rowHeight: number
  className?: string
  overscan?: number
  renderRow: (item: T, index: number) => React.ReactNode
  /** 渲染在列表滚动区域末尾（如「加载更多」） */
  endSlot?: React.ReactNode
}

export function VirtualList<T>({
  items,
  rowHeight,
  className = '',
  overscan = 4,
  renderRow,
  endSlot,
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(480)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setViewportHeight(el.clientHeight)
    })
    ro.observe(el)
    setViewportHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (el) setScrollTop(el.scrollTop)
  }, [])

  const totalHeight = items.length * rowHeight
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(
    items.length,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan,
  )
  const offsetY = start * rowHeight

  return (
    <div
      ref={scrollRef}
      className={`panel-scrollbar overflow-y-auto pr-0.5 ${className}`}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {items.slice(start, end).map((item, i) => (
            <div key={start + i} style={{ height: rowHeight }}>
              {renderRow(item, start + i)}
            </div>
          ))}
        </div>
      </div>
      {endSlot ? <div className="shrink-0 pt-2">{endSlot}</div> : null}
    </div>
  )
}

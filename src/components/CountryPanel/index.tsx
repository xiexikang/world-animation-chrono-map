import { useEffect, useMemo, useState } from 'react'
import {
  COUNTRY_LABELS,
  COUNTRY_NODE_COLORS,
  FILTER_COUNTRIES,
} from '@/constants'
import { PANEL_NODES_PAGE_SIZE } from '@/constants/performance'
import { useVisibleSet } from '@/hooks/useVisibleSet'
import { canvasEmitter } from '@/lib/emitter'
import { resolveCoverUrl } from '@/lib/coverUrl'
import { sortNodesByDate } from '@/lib/sortNodes'
import { useAppStore } from '@/store'
import type { AnimationNode, CountryCode } from '@/types'

function topTheme(nodes: AnimationNode[]): string {
  const counts = new Map<string, number>()
  for (const node of nodes) {
    for (const theme of node.themes) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1)
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? '—'
}

function hexBg(code: CountryCode): string {
  const hex = COUNTRY_NODE_COLORS[code]
  const r = (hex >> 16) & 255
  const g = (hex >> 8) & 255
  const b = hex & 255
  return `rgb(${r},${g},${b})`
}

function selectCountry(code: CountryCode | 'ALL') {
  useAppStore.getState().toggleCountry(code)
  canvasEmitter.emit('country:focus', code)
}

function focusNode(id: string) {
  canvasEmitter.emit('node:focus', String(id))
}

export function CountryPanel() {
  const countries = useAppStore((s) => s.countries)
  const allNodes = useAppStore((s) => s.allNodes)
  const detailCardId = useAppStore((s) => s.detailCardId)
  const visibleSet = useVisibleSet()
  const [query, setQuery] = useState('')
  const [listLimit, setListLimit] = useState(PANEL_NODES_PAGE_SIZE)

  const selected = countries[0] ?? null
  const q = query.trim().toLowerCase()

  const countsByCountry = useMemo(() => {
    const map = new Map<CountryCode, number>()
    for (const node of allNodes) {
      map.set(node.country, (map.get(node.country) ?? 0) + 1)
    }
    return map
  }, [allNodes])

  const countryNodes = useMemo(() => {
    if (!selected) return []
    const filtered = allNodes.filter(
      (node) =>
        node.country === selected &&
        visibleSet.has(node.id) &&
        (q === '' ||
          node.title.toLowerCase().includes(q) ||
          (node.titleEn?.toLowerCase().includes(q) ?? false) ||
          node.themes.some((t) => t.toLowerCase().includes(q))),
    )
    return sortNodesByDate(filtered)
  }, [allNodes, selected, visibleSet, q])

  useEffect(() => {
    setListLimit(PANEL_NODES_PAGE_SIZE)
  }, [selected, q, visibleSet])

  const displayNodes = useMemo(
    () => countryNodes.slice(0, listLimit),
    [countryNodes, listLimit],
  )

  const filteredCountries = useMemo(() => {
    return FILTER_COUNTRIES.filter((code) => {
      if (!q) return true
      const { label, en } = COUNTRY_LABELS[code]
      return (
        label.toLowerCase().includes(q) ||
        en.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q)
      )
    })
  }, [q])

  const meta = selected ? COUNTRY_LABELS[selected] : null

  return (
    <aside
      className="float-panel fixed top-[4.25rem] right-3 bottom-[4.75rem] z-30 flex w-[280px] flex-col overflow-hidden max-md:w-[min(calc(100vw-1.5rem),280px)]"
      aria-label="国家筛选"
    >
      <PanelSearch query={query} setQuery={setQuery} />

      <nav
        className="flex gap-1.5 overflow-x-auto border-b border-white/10 px-3 py-2.5"
        role="radiogroup"
        aria-label="国家单选"
      >
        <CountryPill
          active={!selected}
          onClick={() => selectCountry('ALL')}
          label="全"
          title="全部国家"
        />
        {FILTER_COUNTRIES.map((code) => (
          <CountryPill
            key={code}
            active={selected === code}
            onClick={() => selectCountry(code)}
            label={COUNTRY_LABELS[code].flag}
            title={COUNTRY_LABELS[code].label}
          />
        ))}
      </nav>

      {selected && meta ? (
        <>
          <header className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
            <button
              type="button"
              onClick={() => selectCountry('ALL')}
              className="rounded-md px-2 py-1 text-xs text-text-muted transition hover:bg-white/10 hover:text-text"
            >
              ← 返回
            </button>
            <CountryHeader meta={meta} />
          </header>

          <CountryStats
            count={countryNodes.length}
            theme={topTheme(countryNodes)}
          />

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {countryNodes.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                暂无匹配作品
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2.5">
                  {displayNodes.map((node) => (
                    <NodeGridItem
                      key={node.id}
                      node={node}
                      active={String(detailCardId) === String(node.id)}
                      onSelect={() => focusNode(node.id)}
                    />
                  ))}
                </div>
                {countryNodes.length > listLimit && (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg border border-white/10 py-2 text-xs text-text-muted transition hover:border-accent/40 hover:text-text"
                    onClick={() =>
                      setListLimit((n) =>
                        Math.min(n + PANEL_NODES_PAGE_SIZE, countryNodes.length),
                      )
                    }
                  >
                    加载更多（已显示 {listLimit} / {countryNodes.length}）
                  </button>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <CountryBrowse
          countries={filteredCountries}
          countsByCountry={countsByCountry}
          total={allNodes.length}
          onSelect={selectCountry}
        />
      )}
    </aside>
  )
}

function PanelSearch({
  query,
  setQuery,
}: {
  query: string
  setQuery: (v: string) => void
}) {
  return (
    <div className="border-b border-white/10 px-3 py-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索国家或作品…"
        className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-text placeholder:text-text-muted/70 outline-none focus:border-accent/50"
      />
    </div>
  )
}

function CountryHeader({
  meta,
}: {
  meta: (typeof COUNTRY_LABELS)[CountryCode]
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-base font-semibold">
        {meta.flag} {meta.en}{' '}
        <span className="text-text-muted">{meta.label}</span>
      </p>
    </div>
  )
}

function CountryStats({ count, theme }: { count: number; theme: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 px-3 py-3">
      <StatBox label="作品" value={`${count}`} />
      <StatBox label="热门主题" value={theme} />
    </div>
  )
}

function CountryPill({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean
  onClick: () => void
  label: string
  title: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      title={title}
      onClick={onClick}
      className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-2.5 text-sm transition ${
        active
          ? 'bg-accent font-medium text-bg shadow-[0_0_12px_rgba(255,107,1,0.35)]'
          : 'border border-white/10 bg-white/5 text-text-muted hover:bg-white/10 hover:text-text'
      }`}
    >
      {label}
    </button>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-accent">
        {value}
      </p>
    </div>
  )
}

function NodeGridItem({
  node,
  active,
  onSelect,
}: {
  node: AnimationNode
  active: boolean
  onSelect: () => void
}) {
  const [failed, setFailed] = useState(false)
  const country = COUNTRY_LABELS[node.country]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col items-center gap-1.5 rounded-lg p-1.5 text-left transition ${
        active ? 'bg-accent/15 ring-1 ring-accent/60' : 'hover:bg-white/5'
      }`}
    >
      <NodeAvatar
        node={node}
        country={country}
        active={active}
        failed={failed}
        onFail={() => setFailed(true)}
      />
      <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-text-muted group-hover:text-text">
        {node.title}
      </span>
      {node.year != null && (
        <span className="text-[9px] text-text-muted/70">{node.year}</span>
      )}
    </button>
  )
}

function NodeAvatar({
  node,
  country,
  active,
  failed,
  onFail,
}: {
  node: AnimationNode
  country: { flag: string }
  active: boolean
  failed: boolean
  onFail: () => void
}) {
  return (
    <div
      className={`aspect-square w-full overflow-hidden rounded-full border-2 transition ${
        active ? 'border-accent' : 'border-white/15 group-hover:border-white/30'
      }`}
      style={
        failed || !node.cover
          ? { backgroundColor: hexBg(node.country) }
          : undefined
      }
    >
      {node.cover && !failed ? (
        <img
          src={resolveCoverUrl(node.cover)}
          alt=""
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
          loading="lazy"
          onError={onFail}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xl">
          {country.flag}
        </span>
      )}
    </div>
  )
}

function CountryBrowse({
  countries,
  countsByCountry,
  total,
  onSelect,
}: {
  countries: CountryCode[]
  countsByCountry: Map<CountryCode, number>
  total: number
  onSelect: (code: CountryCode) => void
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <StatBox label="全球作品" value={`${total}`} />
        <StatBox label="国家/地区" value={`${FILTER_COUNTRIES.length}`} />
      </div>
      <p className="mb-2 text-xs text-text-muted">选择国家/地区</p>
      <ul className="flex flex-col gap-1.5">
        {countries.map((code) => {
          const meta = COUNTRY_LABELS[code]
          const count = countsByCountry.get(code) ?? 0
          return (
            <li key={code}>
              <button
                type="button"
                onClick={() => onSelect(code)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2.5 text-left transition hover:border-accent/40 hover:bg-white/5"
              >
                <span className="text-2xl">{meta.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {meta.en}{' '}
                    <span className="text-text-muted">{meta.label}</span>
                  </span>
                  <span className="text-xs text-text-muted">{count} 部作品</span>
                </span>
                <span className="text-text-muted">›</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { COUNTRY_LABELS } from '@/constants'
import { LazyCoverImage } from '@/components/LazyCoverImage'
import { PANEL_NODES_PAGE_SIZE } from '@/constants/performance'
import { useVisibleSet } from '@/hooks/useVisibleSet'
import { getCountryDisplayMeta } from '@/lib/countryMeta'
import { canvasEmitter } from '@/lib/emitter'
import { nodeMatchesSourceCountry } from '@/lib/sourceCountry'
import { sortNodesByDate } from '@/lib/sortNodes'
import { useAppStore } from '@/store'
import type { AnimationNode } from '@/types'
import type { CountryItem } from '@/types/api'

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

function selectCountry(code: string | 'ALL') {
  useAppStore.getState().toggleCountry(code)
  canvasEmitter.emit('country:focus', code)
}

function focusNode(id: string) {
  canvasEmitter.emit('node:focus', String(id))
}

export function CountryPanel() {
  const countries = useAppStore((s) => s.countries)
  const countryCategories = useAppStore((s) => s.countryCategories)
  const countryCategoriesLoaded = useAppStore((s) => s.countryCategoriesLoaded)
  const allNodes = useAppStore((s) => s.allNodes)
  const countryStats = useAppStore((s) => s.countryStats)
  const countryStatsLoaded = useAppStore((s) => s.countryStatsLoaded)
  const detailCardId = useAppStore((s) => s.detailCardId)
  const era = useAppStore((s) => s.era)
  const themes = useAppStore((s) => s.themes)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const visibleSet = useVisibleSet()
  const [query, setQuery] = useState('')
  const [listLimit, setListLimit] = useState(PANEL_NODES_PAGE_SIZE)

  const selected = countries[0] ?? null
  const q = query.trim().toLowerCase()

  const countsByCountry = useMemo(() => {
    const map = new Map<string, number>()
    for (const category of countryCategories) {
      map.set(category.code, countryStats.get(category.code) ?? 0)
    }
    return map
  }, [countryCategories, countryStats])

  const countryNodes = useMemo(() => {
    if (!selected) return []
    const filtered = allNodes.filter(
      (node) =>
        nodeMatchesSourceCountry(node, selected) &&
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
  }, [selected, q, era, themes, searchQuery])

  const displayNodes = useMemo(
    () => countryNodes.slice(0, listLimit),
    [countryNodes, listLimit],
  )

  const filteredCategories = useMemo(() => {
    return countryCategories.filter((item) => {
      if (!q) return true
      const meta = getCountryDisplayMeta(item.code, countryCategories)
      return (
        meta.label.toLowerCase().includes(q) ||
        meta.en.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
      )
    })
  }, [countryCategories, q])

  const meta = selected
    ? getCountryDisplayMeta(selected, countryCategories)
    : null

  if (!countryCategoriesLoaded) {
    return (
      <aside
        className="float-panel fixed top-[4.25rem] right-3 bottom-[4.75rem] z-30 flex w-[280px] items-center justify-center text-sm text-text-muted max-md:w-[min(calc(100vw-1.5rem),280px)]"
        aria-label="国家筛选"
      >
        加载国家分类…
      </aside>
    )
  }

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
          label="全部"
          title="全部国家"
        />
        {countryCategories.map((item) => (
          <CountryPill
            key={item.code}
            active={selected === item.code}
            onClick={() => selectCountry(item.code)}
            label={item.name}
            title={item.name}
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
          categories={filteredCategories}
          allCategories={countryCategories}
          countsByCountry={countsByCountry}
          statsLoaded={countryStatsLoaded}
          total={
            countryStatsLoaded
              ? [...countsByCountry.values()].reduce((a, b) => a + b, 0)
              : allNodes.length
          }
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
  meta: ReturnType<typeof getCountryDisplayMeta>
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-base font-semibold">
        {meta.flag} {meta.label}
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
      className={`flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs transition ${
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
  const showFallback = failed || !node.cover

  return (
    <div
      className={`aspect-square w-full overflow-hidden rounded-full border-2 bg-white/5 transition ${
        active ? 'border-accent' : 'border-white/15 group-hover:border-white/30'
      }`}
    >
      {node.cover && !failed ? (
        <LazyCoverImage src={node.cover} onError={onFail} />
      ) : null}
      {showFallback && (
        <span className="flex h-full w-full items-center justify-center text-xl">
          {country.flag}
        </span>
      )}
    </div>
  )
}

function CountryBrowse({
  categories,
  allCategories,
  countsByCountry,
  statsLoaded,
  total,
  onSelect,
}: {
  categories: CountryItem[]
  allCategories: CountryItem[]
  countsByCountry: Map<string, number>
  statsLoaded: boolean
  total: number
  onSelect: (code: string) => void
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <StatBox label="全球作品" value={`${total}`} />
        <StatBox label="国家/地区" value={`${allCategories.length}`} />
      </div>
      <p className="mb-2 text-xs text-text-muted">选择国家/地区</p>
      <ul className="flex flex-col gap-1.5">
        {categories.map((item) => {
          const meta = getCountryDisplayMeta(item.code, allCategories)
          const count = countsByCountry.get(item.code) ?? 0
          return (
            <li key={item.code}>
              <button
                type="button"
                onClick={() => onSelect(item.code)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-2.5 text-left transition hover:border-accent/40 hover:bg-white/5"
              >
                <span className="text-2xl">{meta.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {meta.en}{' '}
                    <span className="text-text-muted">{meta.label}</span>
                  </span>
                  <span className="text-xs text-text-muted">
                    {statsLoaded ? `${count} 部作品` : '…'}
                  </span>
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

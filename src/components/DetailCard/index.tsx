import { useEffect, useState } from 'react'
import { COUNTRY_LABELS, eraLabel, themeColor } from '@/constants'
import { useAnimeDetailNode } from '@/hooks/useAnimeDetailNode'
import { resolveCoverUrl } from '@/lib/coverUrl'
import { useAppStore } from '@/store'
import type { AnimationNode } from '@/types'

/** 与底部 Timeline 的间距：Timeline 约在 bottom-3 + 高度 ~52px */
const BOTTOM_ABOVE_TIMELINE = 'bottom-[4.75rem]'

export function DetailCard() {
  const detailCardId = useAppStore((s) => s.detailCardId)
  const setDetailCard = useAppStore((s) => s.setDetailCard)
  const setFocusedId = useAppStore((s) => s.setFocusedId)
  const node = useAppStore((s) =>
    s.detailCardId ? s.allNodes.find((n) => String(n.id) === s.detailCardId) : undefined,
  )

  if (!detailCardId || !node) return null

  return (
    <DetailCardContent
      key={node.id}
      node={node}
      onClose={() => {
        setDetailCard(null)
        setFocusedId(null)
      }}
    />
  )
}

function DetailCardContent({
  node: seedNode,
  onClose,
}: {
  node: AnimationNode
  onClose: () => void
}) {
  const { node, status } = useAnimeDetailNode(seedNode)
  const [coverFailed, setCoverFailed] = useState(false)
  const country = COUNTRY_LABELS[node.country]
  const detailLoading = status === 'loading'
  const detailUnavailable = status === 'not_found' || status === 'error'

  useEffect(() => {
    setCoverFailed(false)
  }, [node.id])

  return (
    <aside
      className={`float-panel fixed ${BOTTOM_ABOVE_TIMELINE} left-1/2 z-40 flex w-[min(calc(100vw-1.5rem),24rem)] -translate-x-1/2 flex-col gap-2.5 overflow-hidden p-3 shadow-[0_0_28px_rgba(255,107,1,0.18)] max-h-[min(38vh,220px)]`}
      role="dialog"
      aria-labelledby="detail-title"
    >
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border-2 border-accent/80 bg-white/5 sm:h-28 sm:w-20">
          {node.cover && !coverFailed ? (
            <img
              src={resolveCoverUrl(node.cover)}
              alt=""
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">
              {country.flag}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 id="detail-title" className="text-base font-bold leading-tight sm:text-lg">
                {node.title}
              </h2>
              {node.titleEn && (
                <p className="mt-0.5 text-xs text-text-muted/80">{node.titleEn}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-1 text-text-muted transition hover:bg-white/10 hover:text-text"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>

          {detailLoading && !node.description?.trim() ? (
            <p className="text-sm text-text-muted/60" aria-live="polite">
              正在加载简介…
            </p>
          ) : null}

          {node.description?.trim() ? (
            <p
              className={`line-clamp-3 text-sm leading-relaxed text-text-muted ${detailLoading ? 'opacity-70' : ''}`}
            >
              {node.description}
            </p>
          ) : null}

          {detailUnavailable ? (
            <p className="text-xs text-text-muted/70">
              {status === 'not_found' ? '该作品详情不可用' : '详情加载失败，显示列表信息'}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">
              {country.flag} {country.label}
            </span>
            <span className="rounded-md border border-accent/60 px-2 py-0.5 text-xs text-accent">
              {eraLabel(node.era)}
            </span>
            {node.year != null && (
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-text-muted">
                {node.year} 年
              </span>
            )}
          </div>

          {node.quote?.trim() ? (
            <blockquote className="line-clamp-2 border-l-2 border-accent pl-2 text-xs text-accent">
              「{node.quote}」
            </blockquote>
          ) : null}

          <div className="flex flex-wrap gap-1">
            {node.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-md px-2 py-0.5 text-[10px] text-white sm:text-xs"
                style={{ backgroundColor: themeColor(theme) }}
              >
                {theme}
              </span>
            ))}
          </div>

          {node.externalUrl && (
            <a
              href={node.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline sm:text-sm"
            >
              查看详情 →
            </a>
          )}
        </div>
      </div>
    </aside>
  )
}

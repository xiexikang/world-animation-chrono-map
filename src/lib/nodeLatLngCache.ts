import { buildNodeLatLngMap } from '@/globe/countryRegions'
import type { LatLng } from '@/globe/geo'
import type { AnimationNode } from '@/types'

const latLngCache = new Map<string, LatLng>()

const FLUSH_MS = 200
const MAX_NODES_PER_FLUSH = 80

let pendingNodes: AnimationNode[] = []
const pendingIds = new Set<string>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
let inflight: Promise<void> | null = null

export function getCachedLatLng(nodeId: string): LatLng | undefined {
  return latLngCache.get(nodeId)
}

export function getLatLngCacheSnapshot(): Map<string, LatLng> {
  return new Map(latLngCache)
}

export function mergeLatLngIntoCache(entries: Map<string, LatLng>): void {
  for (const [id, latLng] of entries) {
    latLngCache.set(id, latLng)
  }
}

/** 为缺少缓存的节点批量计算落点（结果写入模块缓存） */
export async function ensureLatLngForNodes(
  nodes: AnimationNode[],
): Promise<Map<string, LatLng>> {
  const missing = nodes.filter((n) => !latLngCache.has(n.id))
  if (missing.length === 0) {
    return getLatLngCacheSnapshot()
  }

  await runLatLngFlush(missing)
  return getLatLngCacheSnapshot()
}

export function buildLatLngMapForNodes(
  nodes: AnimationNode[],
): Map<string, LatLng> {
  const map = new Map<string, LatLng>()
  for (const node of nodes) {
    const cached = latLngCache.get(node.id)
    if (cached) map.set(node.id, cached)
  }
  return map
}

export type LatLngCacheListener = () => void
const latLngListeners = new Set<LatLngCacheListener>()

export function onLatLngCacheReady(listener: LatLngCacheListener): () => void {
  latLngListeners.add(listener)
  return () => {
    latLngListeners.delete(listener)
  }
}

let notifyTimer: ReturnType<typeof setTimeout> | null = null

function notifyLatLngReady() {
  if (notifyTimer != null) return
  notifyTimer = setTimeout(() => {
    notifyTimer = null
    for (const listener of latLngListeners) {
      listener()
    }
  }, 100)
}

async function runLatLngFlush(nodes: AnimationNode[]): Promise<void> {
  if (nodes.length === 0) return

  if (inflight) {
    await inflight
    const stillMissing = nodes.filter((n) => !latLngCache.has(n.id))
    if (stillMissing.length === 0) return
    return runLatLngFlush(stillMissing)
  }

  inflight = (async () => {
    const computed = await buildNodeLatLngMap(nodes)
    mergeLatLngIntoCache(computed)
  })()

  try {
    await inflight
    notifyLatLngReady()
  } finally {
    inflight = null
  }
}

function flushPendingLatLng(): void {
  flushTimer = null
  if (pendingNodes.length === 0) return

  const batch = pendingNodes.splice(0, MAX_NODES_PER_FLUSH)
  for (const node of batch) {
    pendingIds.delete(node.id)
  }

  void runLatLngFlush(batch).then(() => {
    if (pendingNodes.length > 0) {
      scheduleLatLngFlush()
    }
  })
}

function scheduleLatLngFlush(): void {
  if (flushTimer != null) return
  flushTimer = setTimeout(flushPendingLatLng, FLUSH_MS)
}

/** 异步预计算落点（合并、限流），完成后触发 listener */
export function scheduleLatLngForNodes(nodes: AnimationNode[]): void {
  if (nodes.length === 0) return

  for (const node of nodes) {
    if (latLngCache.has(node.id) || pendingIds.has(node.id)) continue
    pendingIds.add(node.id)
    pendingNodes.push(node)
  }

  if (pendingNodes.length === 0) return
  scheduleLatLngFlush()
}

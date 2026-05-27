import * as THREE from 'three'
import { resolveCoverUrl } from './coverUrl'

const MAX_CACHE_SIZE = 120
const MAX_CONCURRENT = 4
const TEX_W = 88
const TEX_H = 124

interface CacheEntry {
  texture: THREE.Texture
}

const cache = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<THREE.Texture | null>>()

/** LRU：最近使用的 key 在末尾 */
const lruKeys: string[] = []

let activeLoads = 0
const waitQueue: Array<() => void> = []

/** 数值越小越优先 */
const priorityByUrl = new Map<string, number>()

function touchLru(url: string) {
  const idx = lruKeys.indexOf(url)
  if (idx >= 0) lruKeys.splice(idx, 1)
  lruKeys.push(url)
}

function evictIfNeeded() {
  while (lruKeys.length > MAX_CACHE_SIZE) {
    const oldest = lruKeys.shift()
    if (!oldest) break
    const entry = cache.get(oldest)
    if (entry) {
      entry.texture.dispose()
      cache.delete(oldest)
    }
    priorityByUrl.delete(oldest)
  }
}

function runInQueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeLoads++
      fn()
        .then(resolve, reject)
        .finally(() => {
          activeLoads--
          const next = waitQueue.shift()
          if (next) next()
        })
    }
    if (activeLoads < MAX_CONCURRENT) run()
    else waitQueue.push(run)
  })
}

function resolveSrc(url: string): string {
  if (url.startsWith('/') || url.startsWith('data:')) return url
  return resolveCoverUrl(url)
}

function loadTextureFromUrl(url: string): Promise<THREE.Texture | null> {
  const src = resolveSrc(url)

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = TEX_W
        canvas.height = TEX_H
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.clearRect(0, 0, TEX_W, TEX_H)
        ctx.drawImage(img, 0, 0, TEX_W, TEX_H)

        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.needsUpdate = true
        resolve(texture)
      } catch {
        resolve(null)
      }
    }

    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** 按优先级预排队（数值小的先加载） */
export function prioritizeCoverTextures(
  urls: string[],
  priority = 0,
): void {
  for (const url of urls) {
    if (!url) continue
    const prev = priorityByUrl.get(url)
    if (prev === undefined || priority < prev) {
      priorityByUrl.set(url, priority)
    }
  }
  waitQueue.sort((_, __) => 0)
}

export function loadCoverTexture(
  url: string,
  priority = 10,
): Promise<THREE.Texture | null> {
  if (!url) return Promise.resolve(null)

  const cached = cache.get(url)
  if (cached) {
    touchLru(url)
    return Promise.resolve(cached.texture)
  }

  const existingPriority = priorityByUrl.get(url)
  if (existingPriority === undefined || priority < existingPriority) {
    priorityByUrl.set(url, priority)
  }

  const inflight = pending.get(url)
  if (inflight) return inflight

  const task = runInQueue(async () => {
    const texture = await loadTextureFromUrl(url)
    if (texture) {
      cache.set(url, { texture })
      touchLru(url)
      evictIfNeeded()
    }
    return texture
  }).finally(() => {
    pending.delete(url)
  })

  pending.set(url, task)
  return task
}

export function clearCoverTextureCache(): void {
  for (const entry of cache.values()) {
    entry.texture.dispose()
  }
  cache.clear()
  lruKeys.length = 0
  priorityByUrl.clear()
}

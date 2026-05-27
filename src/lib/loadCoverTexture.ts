import * as THREE from 'three'
import { resolveCoverUrl } from './coverUrl'

const cache = new Map<string, THREE.Texture>()
const pending = new Map<string, Promise<THREE.Texture | null>>()

const MAX_CONCURRENT = 4
let activeLoads = 0
const waitQueue: Array<() => void> = []

const TEX_W = 88
const TEX_H = 124

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

/** Image → Canvas → Texture，兼容本地 SVG / PNG / WebP */
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

export function loadCoverTexture(url: string): Promise<THREE.Texture | null> {
  if (!url) return Promise.resolve(null)

  const cached = cache.get(url)
  if (cached) return Promise.resolve(cached)

  const inflight = pending.get(url)
  if (inflight) return inflight

  const task = runInQueue(async () => {
    const texture = await loadTextureFromUrl(url)
    if (texture) cache.set(url, texture)
    return texture
  }).finally(() => {
    pending.delete(url)
  })

  pending.set(url, task)
  return task
}

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { MAX_GLOBE_MARKERS_CAP } from '@/constants/performance'
import { resolveNodeLatLng } from '@/globe/countryRegions'
import { pickGlobeNodes } from '@/lib/pickGlobeNodes'
import type { LatLng } from '@/globe/geo'
import {
  applyGlobeView,
  CHINA_GLOBE_CENTER,
  focusGlobeOnLatLng,
  getGlobeCameraPosition,
  resetGlobeCamera,
  WORLD_GLOBE_CENTER,
  WORLD_GLOBE_DISTANCE,
} from '@/globe/focusCamera'
import {
  GlobeScene,
  type GlobeSceneHandle,
} from '@/globe/GlobeScene'
import { useVisibleSet } from '@/hooks/useVisibleSet'
import { canvasEmitter } from '@/lib/emitter'
import {
  buildLatLngMapForNodes,
  ensureLatLngForNodes,
} from '@/lib/nodeLatLngCache'
import { prioritizeCoverTextures } from '@/lib/loadCoverTexture'
import {
  getSourceCountryGlobeCenter,
  sourceCountriesToGlobeRegions,
} from '@/lib/sourceCountry'
import { useAppStore } from '@/store'

export function GlobeWrapper() {
  const allNodes = useAppStore((s) => s.allNodes)
  const globeMarkerLimit = useAppStore((s) => s.globeMarkerLimit)
  const latLngCacheVersion = useAppStore((s) => s.latLngCacheVersion)
  const visibleSet = useVisibleSet()
  const focusedId = useAppStore((s) => s.focusedId)
  const selectedSourceCountries = useAppStore((s) => s.countries)
  const highlightCountries = useMemo(
    () => sourceCountriesToGlobeRegions(selectedSourceCountries),
    [selectedSourceCountries],
  )
  const [latLngMap, setLatLngMap] = useState<Map<string, LatLng>>(() => new Map())
  const [geoReady, setGeoReady] = useState(false)
  const canvasEverMounted = useRef(false)
  const sceneRef = useRef<GlobeSceneHandle>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const defaultViewApplied = useRef(false)
  const initialCamera = getGlobeCameraPosition(CHINA_GLOBE_CENTER)

  const globeNodes = useMemo(
    () => pickGlobeNodes(allNodes, visibleSet, focusedId, globeMarkerLimit),
    [allNodes, visibleSet, focusedId, globeMarkerLimit],
  )

  useEffect(() => {
    if (globeNodes.length === 0) {
      setLatLngMap(new Map())
      setGeoReady(true)
      return
    }

    const cached = buildLatLngMapForNodes(globeNodes)
    if (cached.size > 0) {
      setLatLngMap(cached)
      setGeoReady(true)
    }

    const missing = globeNodes.filter((n) => !cached.has(n.id))
    if (missing.length === 0) return

    let cancelled = false
    void ensureLatLngForNodes(missing).then((map) => {
      if (cancelled) return
      setLatLngMap(buildLatLngMapForNodes(globeNodes))
      setGeoReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [globeNodes, latLngCacheVersion])

  if (geoReady) canvasEverMounted.current = true

  useEffect(() => {
    prioritizeCoverTextures(
      globeNodes.map((n) => n.cover),
      5,
    )
  }, [globeNodes])

  useEffect(() => {
    const focus = (id: string) => {
      const nodeId = String(id)
      const store = useAppStore.getState()
      const node = store.allNodes.find((n) => String(n.id) === nodeId)

      if (node?.countryCode && store.countries[0] !== node.countryCode) {
        store.toggleCountry(node.countryCode)
      }

      const controls = sceneRef.current?.controls
      const camera = cameraRef.current

      const focusAt = (latLng: LatLng) => {
        if (controls && camera) focusGlobeOnLatLng(camera, controls, latLng)
      }

      const cached = latLngMap?.get(nodeId)
      if (cached) {
        focusAt(cached)
      } else if (node) {
        void resolveNodeLatLng(node, latLngMap ?? new Map()).then((pt) => {
          if (!pt) return
          setLatLngMap((prev) => {
            const next = new Map(prev ?? [])
            next.set(nodeId, pt)
            return next
          })
          focusAt(pt)
        })
      }

      store.setFocusedId(nodeId)
      store.setDetailCard(nodeId)
    }

    const onReset = () => {
      const controls = sceneRef.current?.controls
      const camera = cameraRef.current
      if (controls && camera) resetGlobeCamera(camera, controls)
      useAppStore.getState().setFocusedId(null)
      useAppStore.getState().setDetailCard(null)
    }

    const onCountryFocus = (code: string | 'ALL') => {
      const controls = sceneRef.current?.controls
      const camera = cameraRef.current
      if (!controls || !camera) return

      if (code === 'ALL') {
        focusGlobeOnLatLng(
          camera,
          controls,
          WORLD_GLOBE_CENTER,
          WORLD_GLOBE_DISTANCE,
        )
        return
      }

      void getSourceCountryGlobeCenter(code).then((center) => {
        if (!sceneRef.current?.controls || !cameraRef.current) return
        focusGlobeOnLatLng(cameraRef.current, sceneRef.current.controls, center)
      })
    }

    canvasEmitter.on('node:click', focus)
    canvasEmitter.on('node:focus', focus)
    canvasEmitter.on('canvas:reset', onReset)
    canvasEmitter.on('country:focus', onCountryFocus)

    return () => {
      canvasEmitter.off('node:click', focus)
      canvasEmitter.off('node:focus', focus)
      canvasEmitter.off('canvas:reset', onReset)
      canvasEmitter.off('country:focus', onCountryFocus)
    }
  }, [latLngMap])

  useEffect(() => {
    if (!geoReady || defaultViewApplied.current) return
    let cancelled = false
    const applyDefault = () => {
      if (cancelled) return
      const camera = cameraRef.current
      const controls = sceneRef.current?.controls
      if (camera && controls) {
        applyGlobeView(camera, controls, CHINA_GLOBE_CENTER)
        defaultViewApplied.current = true
        return
      }
      requestAnimationFrame(applyDefault)
    }
    applyDefault()
    return () => {
      cancelled = true
    }
  }, [geoReady])

  const showCanvas = canvasEverMounted.current || geoReady

  return (
    <div className="relative h-full w-full bg-[#010208]">
      {!showCanvas ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-text-muted">
          <span>正在布置地球标记…</span>
          <span className="text-xs text-text-muted/70">
            已缓存落点优先 · 最多 {globeMarkerLimit} 个标记
          </span>
        </div>
      ) : (
        <Canvas
          camera={{
            position: initialCamera,
            fov: 45,
            near: 0.1,
            far: 100,
          }}
          dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.75)}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          onCreated={({ camera }) => {
            cameraRef.current = camera as THREE.PerspectiveCamera
          }}
        >
          <Suspense fallback={null}>
            <GlobeScene
              ref={sceneRef}
              nodes={globeNodes}
              latLngMap={latLngMap}
              focusedId={focusedId}
              highlightCountries={highlightCountries}
            />
          </Suspense>
        </Canvas>
      )}
      <p className="pointer-events-none fixed bottom-24 left-1/2 z-10 max-w-[min(90vw,28rem)] -translate-x-1/2 text-center text-xs text-text-muted/80 max-md:bottom-[11rem]">
        拖拽旋转 · 地球 {globeNodes.length}/{globeMarkerLimit} 标记
        {globeMarkerLimit < MAX_GLOBE_MARKERS_CAP && visibleSet.size > globeMarkerLimit
          ? ` · 侧栏加载更多可增至 ${MAX_GLOBE_MARKERS_CAP}`
          : ''}
      </p>
    </div>
  )
}

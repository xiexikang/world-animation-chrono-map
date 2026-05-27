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
  DEFAULT_ORBIT_LIMITS,
  focusGlobeOnLatLng,
  getGlobeCameraPosition,
  resetGlobeCamera,
  type GlobeOrbitLimits,
  WORLD_GLOBE_CENTER,
  WORLD_ORBIT_LIMITS,
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
  getSourceCountryGlobeView,
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
  const selectedCountryCode = selectedSourceCountries[0] ?? null
  const [orbitLimits, setOrbitLimits] =
    useState<GlobeOrbitLimits>(DEFAULT_ORBIT_LIMITS)
  const highlightCountries = useMemo(
    () => sourceCountriesToGlobeRegions(selectedSourceCountries),
    [selectedSourceCountries],
  )
  const [latLngMap, setLatLngMap] = useState<Map<string, LatLng>>(() => new Map())
  const [geoReady, setGeoReady] = useState(false)
  const sceneRef = useRef<GlobeSceneHandle>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const defaultViewApplied = useRef(false)
  const initialCamera = getGlobeCameraPosition(
    CHINA_GLOBE_CENTER,
    DEFAULT_ORBIT_LIMITS.focusDistance,
  )

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
    void ensureLatLngForNodes(missing).then(() => {
      if (cancelled) return
      setLatLngMap(buildLatLngMapForNodes(globeNodes))
      setGeoReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [globeNodes, latLngCacheVersion])

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

    canvasEmitter.on('node:click', focus)
    canvasEmitter.on('node:focus', focus)
    canvasEmitter.on('canvas:reset', onReset)
    return () => {
      canvasEmitter.off('node:click', focus)
      canvasEmitter.off('node:focus', focus)
      canvasEmitter.off('canvas:reset', onReset)
    }
  }, [latLngMap])

  useEffect(() => {
    if (!geoReady) return
    const controls = sceneRef.current?.controls
    const camera = cameraRef.current
    if (!controls || !camera) return

    if (!selectedCountryCode) {
      setOrbitLimits(WORLD_ORBIT_LIMITS)
      focusGlobeOnLatLng(
        camera,
        controls,
        WORLD_GLOBE_CENTER,
        WORLD_ORBIT_LIMITS.focusDistance,
      )
      return
    }

    let cancelled = false
    void getSourceCountryGlobeView(selectedCountryCode).then(({ center, orbit }) => {
      if (cancelled || !sceneRef.current?.controls || !cameraRef.current) return
      setOrbitLimits(orbit)
      focusGlobeOnLatLng(
        cameraRef.current,
        sceneRef.current.controls,
        center,
        orbit.focusDistance,
      )
    })

    return () => {
      cancelled = true
    }
  }, [selectedCountryCode, geoReady])

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

  return (
    <div className="relative h-full w-full bg-transparent">
      <Canvas
        className="!bg-transparent"
        style={{ background: 'transparent' }}
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
        onCreated={({ camera, gl }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Suspense fallback={null}>
          <GlobeScene
            ref={sceneRef}
            nodes={geoReady ? globeNodes : []}
            latLngMap={latLngMap}
            focusedId={focusedId}
            highlightCountries={highlightCountries}
            orbitLimits={orbitLimits}
          />
        </Suspense>
      </Canvas>
      {!geoReady ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs text-text-muted/60">
          <span>正在布置地球标记…</span>
        </div>
      ) : null}
      <p className="pointer-events-none fixed bottom-24 left-1/2 z-10 max-w-[min(90vw,28rem)] -translate-x-1/2 text-center text-xs text-text-muted/80 max-md:bottom-[11rem]">
        拖拽旋转 · 滚轮缩放 · 地球{' '}
        {globeNodes.length}/{globeMarkerLimit} 标记
        {globeMarkerLimit < MAX_GLOBE_MARKERS_CAP && visibleSet.size > globeMarkerLimit
          ? ` · 侧栏加载更多可增至 ${MAX_GLOBE_MARKERS_CAP}`
          : ''}
      </p>
    </div>
  )
}

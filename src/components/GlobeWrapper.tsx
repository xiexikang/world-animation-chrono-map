import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { MAX_GLOBE_MARKERS } from '@/constants/performance'
import {
  buildNodeLatLngMap,
  getCountryGlobeCenter,
  resolveNodeLatLng,
} from '@/globe/countryRegions'
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
import { FILTER_COUNTRIES } from '@/constants'
import { useVisibleSet } from '@/hooks/useVisibleSet'
import { canvasEmitter } from '@/lib/emitter'
import { preloadCoverTextures } from '@/lib/loadCoverTexture'
import { useAppStore } from '@/store'
import type { AnimationNode, CountryCode } from '@/types'

interface GlobeWrapperProps {
  nodes: AnimationNode[]
}

export function GlobeWrapper({ nodes }: GlobeWrapperProps) {
  const visibleSet = useVisibleSet()
  const focusedId = useAppStore((s) => s.focusedId)
  const highlightCountries = useAppStore((s) => s.countries)
  const [latLngMap, setLatLngMap] = useState<Map<string, LatLng> | null>(null)
  const [geoReady, setGeoReady] = useState(false)
  const sceneRef = useRef<GlobeSceneHandle>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const defaultViewApplied = useRef(false)
  const initialCamera = getGlobeCameraPosition(CHINA_GLOBE_CENTER)

  const globeNodes = useMemo(
    () => pickGlobeNodes(nodes, visibleSet, focusedId),
    [nodes, visibleSet, focusedId],
  )

  useEffect(() => {
    if (globeNodes.length === 0) {
      setLatLngMap(new Map())
      setGeoReady(true)
      return
    }
    let cancelled = false
    setGeoReady(false)
    void buildNodeLatLngMap(globeNodes).then((map) => {
      if (!cancelled) {
        setLatLngMap(map)
        setGeoReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [globeNodes])

  useEffect(() => {
    if (globeNodes.length === 0) return
    void preloadCoverTextures(
      globeNodes.map((n) => n.cover),
      12,
      40,
    )
  }, [globeNodes])

  useEffect(() => {
    const focus = (id: string) => {
      const nodeId = String(id)
      const store = useAppStore.getState()
      const node = store.allNodes.find((n) => String(n.id) === nodeId)

      if (node && FILTER_COUNTRIES.includes(node.country)) {
        store.toggleCountry(node.country)
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

    const onCountryFocus = (code: CountryCode | 'ALL') => {
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

      void getCountryGlobeCenter(code).then((center) => {
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

  return (
    <div className="relative h-full w-full bg-[#010208]">
      {!geoReady || !latLngMap ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-text-muted">
          <span>正在布置地球标记…</span>
          <span className="text-xs text-text-muted/70">
            最多 {MAX_GLOBE_MARKERS} 个海报点
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
              visibleSet={visibleSet}
              focusedId={focusedId}
              highlightCountries={highlightCountries}
            />
          </Suspense>
        </Canvas>
      )}
      <p className="pointer-events-none fixed bottom-24 left-1/2 z-10 max-w-[min(90vw,28rem)] -translate-x-1/2 text-center text-xs text-text-muted/80 max-md:bottom-[11rem]">
        拖拽旋转 · 地球展示热度最高的 {Math.min(globeNodes.length, MAX_GLOBE_MARKERS)} 部
        {nodes.length > MAX_GLOBE_MARKERS
          ? `（共 ${nodes.length} 部，完整列表见右侧面板）`
          : ''}
      </p>
    </div>
  )
}

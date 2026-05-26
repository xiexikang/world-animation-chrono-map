import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildNodeLatLngMap, getCountryGlobeCenter } from '@/globe/countryRegions'
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

  useEffect(() => {
    let cancelled = false
    setGeoReady(false)
    void buildNodeLatLngMap(nodes).then((map) => {
      if (!cancelled) {
        setLatLngMap(map)
        setGeoReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [nodes])

  useEffect(() => {
    if (nodes.length === 0) return
    void preloadCoverTextures(nodes.map((n) => n.cover), 24, 0)
  }, [nodes])

  useEffect(() => {
    const focus = (id: string) => {
      const nodeId = String(id)
      const store = useAppStore.getState()
      const node = store.allNodes.find((n) => String(n.id) === nodeId)

      if (node && FILTER_COUNTRIES.includes(node.country)) {
        store.toggleCountry(node.country)
      }

      const latLng = latLngMap?.get(nodeId)
      const controls = sceneRef.current?.controls
      const camera = cameraRef.current
      if (latLng && controls && camera) {
        focusGlobeOnLatLng(camera, controls, latLng)
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
        <div className="flex h-full items-center justify-center text-sm text-text-muted">
          正在按各国版图分布节点…
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
              nodes={nodes}
              latLngMap={latLngMap}
              visibleSet={visibleSet}
              focusedId={focusedId}
              highlightCountries={highlightCountries}
            />
          </Suspense>
        </Canvas>
      )}
      <p className="pointer-events-none fixed bottom-24 left-1/2 z-10 -translate-x-1/2 text-xs text-text-muted/80 max-md:bottom-[11rem]">
        拖拽旋转 · 节点落在各国版图内
      </p>
    </div>
  )
}

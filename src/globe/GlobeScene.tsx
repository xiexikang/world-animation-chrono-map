import { Environment, OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Group, PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { AnimationNode, CountryCode } from '@/types'
import { EARTH_AUTO_ROTATE_SPEED, type LatLng } from './geo'
import { CountryOutlines } from './CountryOutlines'
import { Earth } from './Earth'
import {
  clampGlobeCameraDistance,
  DEFAULT_ORBIT_LIMITS,
  type GlobeOrbitLimits,
} from './focusCamera'
import { GlobeNodeMarker } from './GlobeNodeMarker'
import { Starfield } from './Starfield'

export interface GlobeSceneHandle {
  controls: OrbitControlsImpl | null
}

interface GlobeSceneProps {
  nodes: AnimationNode[]
  latLngMap: Map<string, LatLng>
  focusedId: string | null
  highlightCountries: CountryCode[]
  orbitLimits?: GlobeOrbitLimits
  /** 标记经纬度等已就绪（与 GlobeWrapper 的 geoReady 一致） */
  contentReady?: boolean
}

export const GlobeScene = forwardRef<GlobeSceneHandle, GlobeSceneProps>(
  function GlobeScene(
    {
      nodes,
      latLngMap,
      focusedId,
      highlightCountries,
      orbitLimits = DEFAULT_ORBIT_LIMITS,
      contentReady = false,
    },
    ref,
  ) {
    const controlsRef = useRef<OrbitControlsImpl>(null)
    const globeRef = useRef<Group>(null)
    const autoRotatePaused = useRef(false)
    const canAutoRotate = useRef(false)
    const resumeRotateTimer = useRef<ReturnType<typeof setTimeout>>()
    const [earthReady, setEarthReady] = useState(false)
    const onEarthReady = useCallback(() => setEarthReady(true), [])
    const { camera, scene } = useThree()

    useEffect(() => {
      canAutoRotate.current = earthReady && contentReady
    }, [earthReady, contentReady])

    useFrame((_, delta) => {
      if (
        !canAutoRotate.current ||
        autoRotatePaused.current ||
        !globeRef.current
      ) {
        return
      }
      globeRef.current.rotation.y += delta * EARTH_AUTO_ROTATE_SPEED
    })

    useEffect(
      () => () => {
        clearTimeout(resumeRotateTimer.current)
      },
      [],
    )

    useImperativeHandle(ref, () => ({
      get controls() {
        return controlsRef.current
      },
    }))

    useEffect(() => {
      scene.background = null
    }, [scene])

    useEffect(() => {
      const controls = controlsRef.current
      if (!controls) return
      controls.minDistance = orbitLimits.minDistance
      controls.maxDistance = orbitLimits.maxDistance
      clampGlobeCameraDistance(
        camera as PerspectiveCamera,
        controls,
        orbitLimits.minDistance,
        orbitLimits.maxDistance,
      )
    }, [camera, orbitLimits])

    return (
      <>
        <Starfield />
        <Environment preset="night" background={false} />

        <ambientLight intensity={0.18} color="#4466aa" />
        <hemisphereLight
          args={['#88ccff', '#1a0a2e', 0.55]}
          position={[0, 1, 0]}
        />
        <directionalLight
          position={[6, 3, 5]}
          intensity={1.15}
          color="#e8f2ff"
        />
        <directionalLight
          position={[-5, -2, -4]}
          intensity={0.35}
          color="#8866ff"
        />
        <pointLight position={[3, 1, 4]} intensity={0.45} color="#66eeff" />
        <pointLight position={[-3, -2, 2]} intensity={0.25} color="#aa66ff" />
        <spotLight
          position={[0, 6, 2]}
          angle={0.35}
          penumbra={0.8}
          intensity={0.5}
          color="#b8e8ff"
          distance={20}
        />

        <group ref={globeRef}>
          <Earth onReady={onEarthReady} />
          <CountryOutlines highlightCountries={highlightCountries} />
          {nodes.map((node) => {
            const latLng = latLngMap.get(node.id)
            if (!latLng) return null
            return (
              <GlobeNodeMarker
                key={node.id}
                node={node}
                latLng={latLng}
                visible
                focused={node.id === focusedId}
              />
            )
          })}
        </group>
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={orbitLimits.minDistance}
          maxDistance={orbitLimits.maxDistance}
          rotateSpeed={0.5}
          zoomSpeed={0.85}
          dampingFactor={0.06}
          enableDamping
          onStart={() => {
            autoRotatePaused.current = true
            clearTimeout(resumeRotateTimer.current)
          }}
          onEnd={() => {
            clearTimeout(resumeRotateTimer.current)
            resumeRotateTimer.current = setTimeout(() => {
              autoRotatePaused.current = false
            }, 2500)
          }}
        />
      </>
    )
  },
)

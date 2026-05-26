import { Environment, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { AnimationNode, CountryCode } from '@/types'
import type { LatLng } from './geo'
import { CountryOutlines } from './CountryOutlines'
import { Earth } from './Earth'
import { GlobeNodeMarker } from './GlobeNodeMarker'
import { Starfield } from './Starfield'

export interface GlobeSceneHandle {
  controls: OrbitControlsImpl | null
}

interface GlobeSceneProps {
  nodes: AnimationNode[]
  latLngMap: Map<string, LatLng>
  visibleSet: Set<string>
  focusedId: string | null
  highlightCountries: CountryCode[]
}

export const GlobeScene = forwardRef<GlobeSceneHandle, GlobeSceneProps>(
  function GlobeScene(
    { nodes, latLngMap, visibleSet, focusedId, highlightCountries },
    ref,
  ) {
    const controlsRef = useRef<OrbitControlsImpl>(null)

    useImperativeHandle(ref, () => ({
      get controls() {
        return controlsRef.current
      },
    }))

    return (
      <>
        <color attach="background" args={['#010208']} />
        <fog attach="fog" args={['#010208', 32, 100]} />
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

        <Earth />
        <CountryOutlines highlightCountries={highlightCountries} />
        {nodes.map((node) => {
          const id = String(node.id)
          const latLng = latLngMap.get(id)
          if (!latLng) return null
          return (
            <GlobeNodeMarker
              key={id}
              node={node}
              latLng={latLng}
              visible={visibleSet.has(id)}
              focused={focusedId === id}
            />
          )
        })}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={1.55}
          maxDistance={3.2}
          rotateSpeed={0.5}
          zoomSpeed={0.7}
          dampingFactor={0.06}
          enableDamping
        />
      </>
    )
  },
)

import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { AnimationNode } from '@/types'
import { canvasEmitter } from '@/lib/emitter'
import { loadCoverTexture } from '@/lib/loadCoverTexture'
import type { LatLng } from './geo'
import { latLngToNodePosition } from './geo'

/** 球面海报尺寸（世界单位） */
const COVER_W = 0.018
const COVER_H = 0.025

interface GlobeNodeMarkerProps {
  node: AnimationNode
  latLng: LatLng
  visible: boolean
  focused: boolean
}

const _scale = new THREE.Vector3()

export function GlobeNodeMarker({
  node,
  latLng,
  visible,
  focused,
}: GlobeNodeMarkerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const [x, y, z] = latLngToNodePosition(latLng.lat, latLng.lng)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!visible) {
      setTexture(null)
      const mat = matRef.current
      if (mat) {
        mat.map = null
        mat.needsUpdate = true
      }
      return
    }
    let alive = true
    setTexture(null)
    void loadCoverTexture(node.cover).then((tex) => {
      if (!alive || !tex) return
      setTexture(tex)
      const mat = matRef.current
      if (mat) {
        mat.map = tex
        mat.needsUpdate = true
      }
    })
    return () => {
      alive = false
    }
  }, [node.cover, visible])

  useFrame(() => {
    const g = groupRef.current
    const mat = matRef.current
    if (!g || !mat) return
    const target = focused ? 1.3 : visible ? 1 : 0.75
    const hasCover = Boolean(texture)
    const targetOpacity =
      !hasCover ? 0 : visible ? 1 : focused ? 0.85 : 0.18
    _scale.set(target, target, target)
    g.scale.lerp(_scale, 0.15)
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.12)
  })

  return (
    <group ref={groupRef} position={[x, y, z]}>
      <Billboard follow>
        <mesh
          renderOrder={10}
          onClick={(e) => {
            e.stopPropagation()
            canvasEmitter.emit('node:click', String(node.id))
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default'
          }}
        >
          <planeGeometry args={[COVER_W, COVER_H]} />
          <meshBasicMaterial
            ref={matRef}
            map={texture ?? undefined}
            color={0xffffff}
            transparent
            opacity={0}
            depthTest
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {focused && (
          <mesh position={[0, 0, -0.0005]} scale={1.12}>
            <planeGeometry args={[COVER_W * 1.15, COVER_H * 1.15]} />
            <meshBasicMaterial
              color="#ff6b01"
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
        )}
      </Billboard>
    </group>
  )
}

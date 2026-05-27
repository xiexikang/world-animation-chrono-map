import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { AnimationNode } from '@/types'
import { canvasEmitter } from '@/lib/emitter'
import { loadCoverTexture } from '@/lib/loadCoverTexture'
import type { LatLng } from './geo'
import { latLngToNodePosition } from './geo'

/** 有海报时的目标透明度；无 map 时保持 0，避免黑块 */
const OPACITY_COVER = 0.92
const OPACITY_FOCUSED = 1
const OPACITY_DIM = 0.18
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

  useEffect(() => {
    const mat = matRef.current
    if (!visible) {
      if (mat) {
        mat.map = null
        mat.opacity = 0
        mat.needsUpdate = true
      }
      return
    }

    let alive = true
    if (mat) {
      mat.map = null
      mat.opacity = 0
      mat.needsUpdate = true
    }

    if (!node.cover) {
      return () => {
        alive = false
      }
    }

    void loadCoverTexture(node.cover).then((tex) => {
      if (!alive || !tex) return
      const material = matRef.current
      if (material) {
        material.map = tex
        material.opacity = 0
        material.needsUpdate = true
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

    const hasMap = Boolean(mat.map)

    // 无贴图时不渲染，避免加载前出现黑块
    g.visible = hasMap

    const targetScale = focused ? 1.3 : visible ? 1 : 0.75
    const targetOpacity = !hasMap
      ? 0
      : focused
        ? OPACITY_FOCUSED
        : visible
          ? OPACITY_COVER
          : OPACITY_DIM

    _scale.set(targetScale, targetScale, targetScale)
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
            color={0xffffff}
            transparent
            opacity={0}
            alphaTest={0.04}
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

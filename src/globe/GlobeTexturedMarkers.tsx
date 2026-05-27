import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { canvasEmitter } from '@/lib/emitter'
import {
  loadCoverTexture,
  prioritizeCoverTextures,
} from '@/lib/loadCoverTexture'
import { pickTexturedGlobeNodes } from '@/lib/pickTexturedGlobeNodes'
import type { AnimationNode } from '@/types'
import type { LatLng } from './geo'
import { latLngToNodePosition } from './geo'

const COVER_W = 0.018
const COVER_H = 0.025
const sharedGeometry = new THREE.PlaneGeometry(COVER_W, COVER_H)

interface TexturedMarkerProps {
  node: AnimationNode
  latLng: LatLng
  focused: boolean
  priority: number
}

function TexturedMarker({ node, latLng, focused, priority }: TexturedMarkerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const [x, y, z] = latLngToNodePosition(latLng.lat, latLng.lng)

  useEffect(() => {
    let alive = true
    void loadCoverTexture(node.cover, priority).then((tex) => {
      if (!alive || !tex) return
      const mat = matRef.current
      if (mat) {
        mat.map = tex
        mat.needsUpdate = true
      }
    })
    return () => {
      alive = false
    }
  }, [node.cover, priority])

  useFrame(({ camera }) => {
    const g = groupRef.current
    const mat = matRef.current
    if (!g || !mat) return
    g.lookAt(camera.position)
    const s = focused ? 1.3 : 1
    targetScaleRef.current.set(s, s, s)
    g.scale.lerp(targetScaleRef.current, 0.15)
    if (!mat.map) {
      mat.opacity = 0
      return
    }
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, 1, 0.12)
  })

  return (
    <group ref={groupRef} position={[x, y, z]}>
      <mesh
        geometry={sharedGeometry}
        renderOrder={11}
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
        <meshBasicMaterial
          ref={matRef}
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
    </group>
  )
}

interface GlobeTexturedMarkersProps {
  nodes: AnimationNode[]
  latLngMap: Map<string, LatLng>
  focusedId: string | null
  maxTextured?: number
}

export function GlobeTexturedMarkers({
  nodes,
  latLngMap,
  focusedId,
  maxTextured = 40,
}: GlobeTexturedMarkersProps) {
  const texturedNodes = useMemo(
    () => pickTexturedGlobeNodes(nodes, focusedId, maxTextured),
    [nodes, focusedId, maxTextured],
  )

  useEffect(() => {
    prioritizeCoverTextures(
      texturedNodes.map((n) => n.cover),
      0,
    )
    if (focusedId) {
      const focused = nodes.find((n) => n.id === focusedId)
      if (focused?.cover) prioritizeCoverTextures([focused.cover], -1)
    }
  }, [texturedNodes, focusedId, nodes])

  return (
    <>
      {texturedNodes.map((node, index) => {
        const latLng = latLngMap.get(node.id)
        if (!latLng) return null
        const priority = node.id === focusedId ? -1 : index
        return (
          <TexturedMarker
            key={node.id}
            node={node}
            latLng={latLng}
            focused={node.id === focusedId}
            priority={priority}
          />
        )
      })}
    </>
  )
}

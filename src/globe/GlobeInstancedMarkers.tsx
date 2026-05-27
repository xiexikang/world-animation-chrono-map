import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { COUNTRY_NODE_COLORS } from '@/constants'
import { canvasEmitter } from '@/lib/emitter'
import type { AnimationNode, CountryCode } from '@/types'
import type { LatLng } from './geo'
import { latLngToNodePosition } from './geo'

const COVER_W = 0.018
const COVER_H = 0.025

interface MarkerEntry {
  node: AnimationNode
  position: THREE.Vector3
}

interface GlobeInstancedMarkersProps {
  nodes: AnimationNode[]
  latLngMap: Map<string, LatLng>
  excludeIds?: Set<string>
}

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()
const sharedGeometry = new THREE.PlaneGeometry(COVER_W, COVER_H)

export function GlobeInstancedMarkers({
  nodes,
  latLngMap,
  excludeIds,
}: GlobeInstancedMarkersProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { camera } = useThree()

  const entries = useMemo(() => {
    const list: MarkerEntry[] = []
    for (const node of nodes) {
      if (excludeIds?.has(node.id)) continue
      const latLng = latLngMap.get(node.id)
      if (!latLng) continue
      const [x, y, z] = latLngToNodePosition(latLng.lat, latLng.lng)
      list.push({
        node,
        position: new THREE.Vector3(x, y, z),
      })
    }
    return list
  }, [nodes, latLngMap, excludeIds])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh || entries.length === 0) return

    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(entries.length * 3),
      3,
    )

    for (let i = 0; i < entries.length; i += 1) {
      _color.setHex(
        COUNTRY_NODE_COLORS[entries[i]!.node.country as CountryCode] ?? 0x9ca3af,
      )
      mesh.setColorAt(i, _color)
    }
    mesh.instanceColor.needsUpdate = true
  }, [entries])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i]!
      _dummy.position.copy(entry.position)
      _dummy.lookAt(camera.position)
      _dummy.scale.set(1, 1, 1)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    }

    mesh.count = entries.length
    mesh.instanceMatrix.needsUpdate = true
  })

  if (entries.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[sharedGeometry, undefined, entries.length]}
      frustumCulled={false}
      renderOrder={10}
      onClick={(e) => {
        e.stopPropagation()
        const idx = e.instanceId
        if (idx == null) return
        const entry = entries[idx]
        if (entry) canvasEmitter.emit('node:click', String(entry.node.id))
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
        color="#ffffff"
        vertexColors
        transparent
        opacity={0.92}
        depthTest
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

import { useMemo, useRef } from 'react'
import { MeshTransmissionMaterial, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  type Group,
  type Texture,
} from 'three'

const EARTH_MAP =
  'https://unpkg.com/three-globe/example/img/earth-night.jpg'

function buildStarPositions(count: number) {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 0.62 + Math.random() * 0.36
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  return positions
}

function InnerStarfield() {
  const ref = useRef<Group>(null)
  const positions = useMemo(() => buildStarPositions(4200), [])
  const accentPositions = useMemo(() => buildStarPositions(1400), [])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.015
  })

  return (
    <group ref={ref}>
      <points renderOrder={0}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.016}
          color="#e8f4ff"
          transparent
          opacity={1}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <points renderOrder={0}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[accentPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.024}
          color="#66ccff"
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  )
}

function CoreGlow() {
  return (
    <mesh scale={0.94} renderOrder={0}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color="#1a0a3a"
        transparent
        opacity={0.55}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

function InnerEarthSurface({ colorMap }: { colorMap: Texture }) {
  const ref = useRef<Group>(null)

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.008
  })

  return (
    <group ref={ref} scale={0.986}>
      <mesh renderOrder={1}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          emissive="#3a6ad4"
          emissiveIntensity={1.35}
          transparent
          opacity={0.92}
          roughness={0.85}
          metalness={0.05}
          toneMapped
        />
      </mesh>
    </group>
  )
}

function GlassShell() {
  return (
    <mesh renderOrder={2}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshTransmissionMaterial
        backside
        backsideThickness={0.35}
        samples={6}
        resolution={768}
        transmission={1}
        thickness={0.65}
        roughness={0.03}
        ior={1.52}
        chromaticAberration={0.08}
        anisotropy={0.35}
        distortion={0.15}
        distortionScale={0.22}
        temporalDistortion={0.12}
        color="#9ad4ff"
        attenuationColor="#0a1438"
        attenuationDistance={0.75}
        toneMapped
      />
    </mesh>
  )
}

function GlassAtmosphere() {
  return (
    <>
      <mesh scale={1.008} renderOrder={3}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#5ce1ff"
          transparent
          opacity={0.22}
          side={BackSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh scale={1.022} renderOrder={3}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#a8f0ff"
          transparent
          opacity={0.12}
          side={BackSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh scale={1.045} renderOrder={3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#c4a0ff"
          transparent
          opacity={0.08}
          side={BackSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh scale={1.003} renderOrder={3}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.06}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </>
  )
}

export function Earth() {
  const [colorMap] = useTexture([EARTH_MAP])

  return (
    <group>
      <InnerStarfield />
      <CoreGlow />
      <InnerEarthSurface colorMap={colorMap} />
      <GlassShell />
      <GlassAtmosphere />
    </group>
  )
}

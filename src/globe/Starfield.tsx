import { Sparkles, Stars } from '@react-three/drei'

/** 多层星空 + 环绕微粒 */
export function Starfield() {
  return (
    <>
      <Stars
        radius={150}
        depth={80}
        count={12000}
        factor={4.5}
        saturation={0.2}
        fade
        speed={0.2}
      />
      <Stars
        radius={95}
        depth={50}
        count={5500}
        factor={3}
        saturation={0.05}
        fade
        speed={0.4}
      />
      <Stars
        radius={58}
        depth={28}
        count={2200}
        factor={1.8}
        saturation={0}
        fade
        speed={0.6}
      />
      <Sparkles
        count={180}
        scale={[14, 14, 14]}
        size={2.5}
        speed={0.35}
        opacity={0.45}
        color="#88ddff"
      />
    </>
  )
}

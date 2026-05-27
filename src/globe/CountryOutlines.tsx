import { Line } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { COUNTRY_NODE_COLORS, GLOBE_COUNTRY_CODES } from '@/constants'
import type { CountryCode } from '@/types'
import { GLOBE_RADIUS } from './geo'
import { latLngToVector3 } from './geo'
import { getCountryOutlineRings } from './countryRegions'

const OUTLINE_RADIUS = GLOBE_RADIUS + 0.004
function ringToPoints(ring: number[][]): [number, number, number][] {
  const pts: [number, number, number][] = []
  for (const [lng, lat] of ring) {
    const [x, y, z] = latLngToVector3(lat, lng, OUTLINE_RADIUS)
    pts.push([x, y, z])
  }
  if (pts.length > 0) pts.push(pts[0])
  return pts
}

function hexToRgb(hex: number): [number, number, number] {
  return [
    ((hex >> 16) & 255) / 255,
    ((hex >> 8) & 255) / 255,
    (hex & 255) / 255,
  ]
}

export function CountryOutlines({
  highlightCountries,
}: {
  highlightCountries: CountryCode[]
}) {
  const [rings, setRings] = useState<Map<CountryCode, number[][][]> | null>(
    null,
  )

  useEffect(() => {
    void getCountryOutlineRings().then(setRings)
  }, [])

  if (!rings) return null

  return (
    <group>
      {GLOBE_COUNTRY_CODES.map((code) => {
        const countryRings = rings.get(code)
        if (!countryRings?.length) return null
        const highlighted =
          highlightCountries.length === 0 || highlightCountries.includes(code)
        const [r, g, b] = hexToRgb(COUNTRY_NODE_COLORS[code])
        const color = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
        const opacity = highlighted ? 0.88 : 0.28
        const lineWidth = highlighted ? 1.4 : 0.5

        return countryRings.map((ring, i) => {
          const points = ringToPoints(ring)
          if (points.length < 2) return null
          return (
            <Line
              key={`${code}-${i}`}
              points={points}
              color={color}
              lineWidth={highlighted ? lineWidth : lineWidth * 0.6}
              transparent
              opacity={opacity}
            />
          )
        })
      })}
    </group>
  )
}

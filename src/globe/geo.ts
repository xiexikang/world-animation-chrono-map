export const GLOBE_RADIUS = 1
export const NODE_SURFACE_OFFSET = 0.026

export interface LatLng {
  lat: number
  lng: number
}

/** 经纬度 → 球面三维坐标（Y 轴朝上） */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return [x, y, z]
}

export function latLngToNodePosition(
  lat: number,
  lng: number,
): [number, number, number] {
  return latLngToVector3(lat, lng, GLOBE_RADIUS + NODE_SURFACE_OFFSET)
}

/** 节点位置由 countryRegions.ts 按真实国界生成，JSON 内 x/y 不再使用 */
export type { LatLng as NodeLatLng }

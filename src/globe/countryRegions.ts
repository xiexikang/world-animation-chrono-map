import bbox from '@turf/bbox'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import countries110m from 'world-atlas/countries-110m.json'
import type { AnimationNode, CountryCode } from '@/types'
import type { LatLng } from './geo'
import {
  DEFAULT_ORBIT_LIMITS,
  type GlobeOrbitLimits,
} from './focusCamera'
import { sortNodesByDate } from '@/lib/sortNodes'

/** Natural Earth 国家名 → 数据源 ISO（与 /api/countries 一致） */
const NATURAL_EARTH_TO_CODE: Record<string, CountryCode> = {
  China: 'CN',
  Japan: 'JP',
  'United States of America': 'US',
  'United Kingdom': 'GB',
  Ireland: 'IE',
  France: 'FR',
  Belgium: 'BE',
  Finland: 'FI',
  Czechia: 'CZ',
  'South Korea': 'KR',
}

/** 非 10 国数据源时的节点落点（TMDB 其它出品国） */
const OTHER_TERRITORY_NAMES = [
  'Canada',
  'Australia',
  'Brazil',
  'Mexico',
  'India',
  'Thailand',
  'Indonesia',
  'Philippines',
  'South Africa',
  'Argentina',
  'Chile',
  'New Zealand',
  'Turkey',
  'Israel',
  'Egypt',
  'Nigeria',
  'Kenya',
]

type GeoPoly = Feature<Polygon | MultiPolygon>

let regionCache: Map<CountryCode, GeoPoly[]> | null = null
const centerCache = new Map<CountryCode, LatLng>()

function seededRng(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 10000) / 10000
  }
}

function asPolygonFeatures(geom: Geometry): GeoPoly[] {
  if (geom.type === 'Polygon') {
    return [{ type: 'Feature', properties: {}, geometry: geom }]
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.map((coords) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: coords },
    }))
  }
  return []
}

export async function loadCountryRegions(): Promise<
  Map<CountryCode, GeoPoly[]>
> {
  if (regionCache) return regionCache

  const topology = countries110m as unknown as Topology
  const collection = feature(
    topology,
    topology.objects.countries,
  ) as FeatureCollection

  const buckets = new Map<CountryCode, GeoPoly[]>()
  const push = (code: CountryCode, poly: GeoPoly) => {
    const list = buckets.get(code) ?? []
    list.push(poly)
    buckets.set(code, list)
  }

  for (const f of collection.features) {
    const name = f.properties?.name as string | undefined
    if (!name) continue
    const polys = asPolygonFeatures(f.geometry as Geometry)
    if (polys.length === 0) continue

    const code = NATURAL_EARTH_TO_CODE[name]
    if (code) {
      polys.forEach((p) => push(code, p))
      continue
    }
    if (OTHER_TERRITORY_NAMES.includes(name)) {
      polys.forEach((p) => push('OTHER', p))
    }
  }

  regionCache = buckets
  return buckets
}

/** 根据该国所有版图多边形外接框计算相机对准中心 */
export async function getCountryGlobeCenter(
  code: CountryCode,
): Promise<LatLng> {
  const cached = centerCache.get(code)
  if (cached) return cached

  const regions = await loadCountryRegions()
  const polys = regions.get(code)
  if (!polys?.length) return { lat: 20, lng: 0 }

  let minLng = 180
  let maxLng = -180
  let minLat = 90
  let maxLat = -90

  for (const poly of polys) {
    const [minX, minY, maxX, maxY] = bbox(poly)
    minLng = Math.min(minLng, minX)
    maxLng = Math.max(maxLng, maxX)
    minLat = Math.min(minLat, minY)
    maxLat = Math.max(maxLat, maxY)
  }

  const center: LatLng = {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  }
  centerCache.set(code, center)
  return center
}

function pointInPolys(lng: number, lat: number, polys: GeoPoly[]): boolean {
  const p = point([lng, lat])
  return polys.some((poly) => booleanPointInPolygon(p, poly))
}

function combinedBbox(polys: GeoPoly[]): [number, number, number, number] {
  let minLng = 180
  let maxLng = -180
  let minLat = 90
  let maxLat = -90
  for (const poly of polys) {
    const [minX, minY, maxX, maxY] = bbox(poly)
    minLng = Math.min(minLng, minX)
    maxLng = Math.max(maxLng, maxX)
    minLat = Math.min(minLat, minY)
    maxLat = Math.max(maxLat, maxY)
  }
  return [minLng, minLat, maxLng, maxLat]
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function regionDiagKm(polys: GeoPoly[]): number {
  const [minLng, minLat, maxLng, maxLat] = combinedBbox(polys)
  return haversineKm(
    { lat: minLat, lng: minLng },
    { lat: maxLat, lng: maxLng },
  )
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * 按版图外接框对角线（公里）插值相机参数。
 * distance = 相机到地心的距离（地球半径为 1，原默认 focus ≈ 2.05）。
 * 仅对中小版图略拉近；大国（对角线 > 3800km）保持 DEFAULT，避免中国/美国过近。
 */
export function orbitLimitsFromRegionDiagKm(diagKm: number): GlobeOrbitLimits {
  const t = Math.min(Math.max((diagKm - 700) / 5100, 0), 1)
  return {
    focusDistance: lerp(1.72, 2.62, t),
    minDistance: lerp(1.48, 1.55, t),
    maxDistance: lerp(2.4, 3.2, t),
  }
}

/** 版图外接框对角线超过此值视为大国，用默认全球式视距 */
const LARGE_REGION_DIAG_KM = 3800

export async function getGlobeOrbitLimitsForRegion(
  code: CountryCode,
): Promise<GlobeOrbitLimits> {
  const regions = await loadCountryRegions()
  const polys = regions.get(code)
  if (!polys?.length) return DEFAULT_ORBIT_LIMITS
  const diagKm = regionDiagKm(polys)
  if (diagKm >= LARGE_REGION_DIAG_KM) return DEFAULT_ORBIT_LIMITS
  return orbitLimitsFromRegionDiagKm(diagKm)
}

function minDistanceTo(latLng: LatLng, others: LatLng[]): number {
  if (others.length === 0) return Infinity
  return Math.min(...others.map((o) => haversineKm(latLng, o)))
}

/** 海报在地球表面可读的最小间距（公里） */
const POSTER_MIN_SEP_KM = 140

function regionCenter(polys: GeoPoly[]): LatLng {
  const [minLng, minLat, maxLng, maxLat] = combinedBbox(polys)
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
}

/** 按版图外接矩形估算「版图内」可舒适放置的海报数量 */
function estimateInCountryCapacity(polys: GeoPoly[], minSepKm: number): number {
  const [minLng, minLat, maxLng, maxLat] = combinedBbox(polys)
  const midLat = (minLat + maxLat) / 2
  const latKm = Math.max(maxLat - minLat, 0.5) * 111.32
  const lngKm =
    Math.max(maxLng - minLng, 0.5) *
    111.32 *
    Math.cos((midLat * Math.PI) / 180)
  const effectiveAreaKm2 = latKm * lngKm * 0.52
  const cellArea = minSepKm * minSepKm * 1.15
  return Math.max(4, Math.floor(effectiveAreaKm2 / cellArea))
}

/** 超出版图容量的作品：绕国家中心螺旋排布（多在近海，避免挤在岛内） */
function placeOverflowHalo(
  nodes: AnimationNode[],
  center: LatLng,
  seed: string,
): Map<string, LatLng> {
  const result = new Map<string, LatLng>()
  if (nodes.length === 0) return result

  const rng = seededRng(`${seed}:halo`)
  const latScale = 0.9
  const lngScale = 1 / Math.max(0.35, Math.cos((center.lat * Math.PI) / 180))
  const baseRadius = 2.6
  const ringStep = 2.0
  const perRing = 14

  for (let i = 0; i < nodes.length; i++) {
    const ring = Math.floor(i / perRing)
    const idxInRing = i % perRing
    const angle =
      idxInRing * ((Math.PI * 2) / perRing) + ring * 0.45 + (rng() - 0.5) * 0.12
    const radius = baseRadius + ring * ringStep + (rng() - 0.5) * 0.2
    result.set(nodes[i]!.id, {
      lat: center.lat + radius * latScale * Math.cos(angle),
      lng: center.lng + radius * lngScale * Math.sin(angle),
    })
  }

  return result
}

/** 在版图内生成网格候选点，尽量覆盖空白区域 */
function buildCandidatePool(
  polys: GeoPoly[],
  nodeCount: number,
  seed: string,
): LatLng[] {
  const [minLng, minLat, maxLng, maxLat] = combinedBbox(polys)
  const latSpan = Math.max(maxLat - minLat, 0.5)
  const lngSpan = Math.max(maxLng - minLng, 0.5)
  const aspect = lngSpan / latSpan
  const target = Math.min(900, Math.max(nodeCount * 20, 64))
  const rows = Math.max(4, Math.round(Math.sqrt(target / aspect)))
  const cols = Math.max(4, Math.round(Math.sqrt(target * aspect)))
  const rng = seededRng(`${seed}:grid`)
  const seen = new Set<string>()
  const candidates: LatLng[] = []

  const push = (lat: number, lng: number) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
    if (seen.has(key)) return
    if (!pointInPolys(lng, lat, polys)) return
    seen.add(key)
    candidates.push({ lat, lng })
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellLat = latSpan / rows
      const cellLng = lngSpan / cols
      const lat =
        minLat +
        (r + 0.5) * cellLat +
        (rng() - 0.5) * cellLat * 0.35
      const lng =
        minLng +
        (c + 0.5) * cellLng +
        (rng() - 0.5) * cellLng * 0.35
      push(lat, lng)
    }
  }

  let attempts = 0
  while (candidates.length < nodeCount * 4 && attempts < 2400) {
    attempts++
    const poly = polys[Math.floor(rng() * polys.length)]!
    const [pMinLng, pMinLat, pMaxLng, pMaxLat] = bbox(poly)
    push(
      pMinLat + rng() * (pMaxLat - pMinLat),
      pMinLng + rng() * (pMaxLng - pMinLng),
    )
  }

  return candidates
}

/** 版图内最远点采样 */
function spreadInsideCountry(
  nodes: AnimationNode[],
  polys: GeoPoly[],
  seed: string,
): Map<string, LatLng> {
  const n = nodes.length
  if (n === 0) return new Map()

  let pool = buildCandidatePool(polys, n, seed)
  const rng = seededRng(`${seed}:fps`)
  const [minLng, minLat, maxLng, maxLat] = combinedBbox(polys)
  const diagKm = haversineKm(
    { lat: minLat, lng: minLng },
    { lat: maxLat, lng: maxLng },
  )
  const minSepKm = Math.max(
    POSTER_MIN_SEP_KM,
    (diagKm / Math.sqrt(n * 1.15)) * 0.42,
  )

  const selected: LatLng[] = []
  const result = new Map<string, LatLng>()

  const pickFromPool = (): LatLng | null => {
    if (pool.length === 0) return null
    let bestIdx = 0
    let bestScore = -1
    for (let i = 0; i < pool.length; i++) {
      const score = minDistanceTo(pool[i]!, selected)
      if (score > bestScore) {
        bestScore = score
        bestIdx = i
      }
    }
    const [picked] = pool.splice(bestIdx, 1)
    return picked ?? null
  }

  for (let i = 0; i < pool.length - 1; i++) {
    const j = i + 1 + Math.floor(rng() * (pool.length - i - 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }

  for (let i = 0; i < n; i++) {
    let picked = pickFromPool()
    if (!picked) {
      pool = buildCandidatePool(polys, n, `${seed}:refill-${i}`)
      picked = pickFromPool()
    }
    if (!picked) {
      const poly = polys[i % polys.length]!
      const pt = randomPointInPolygon(poly, rng)
      if (pt) picked = pt
    }
    if (!picked) continue

    selected.push(picked)
    result.set(nodes[i]!.id, picked)
    pool = pool.filter((c) => haversineKm(c, picked!) >= minSepKm * 0.35)
  }

  return result
}

/**
 * 小国高密度：优先在真实版图内均匀落点；超出容量的作品绕中心螺旋排布，避免岛内堆叠。
 */
function spreadNodesInCountry(
  nodes: AnimationNode[],
  polys: GeoPoly[],
): Map<string, LatLng> {
  const sorted = sortNodesByDate(nodes)
  const n = sorted.length
  if (n === 0) return new Map()

  const seed = `${sorted[0]?.country ?? 'X'}-${n}-${sorted[0]?.id ?? ''}-${sorted[n - 1]?.id ?? ''}`
  const inCountryCap = estimateInCountryCapacity(polys, POSTER_MIN_SEP_KM)
  const inCountryNodes = sorted.slice(0, Math.min(n, inCountryCap))
  const overflowNodes = sorted.slice(inCountryCap)

  const result = spreadInsideCountry(inCountryNodes, polys, seed)
  if (overflowNodes.length > 0) {
    const halo = placeOverflowHalo(
      overflowNodes,
      regionCenter(polys),
      seed,
    )
    for (const [id, latLng] of halo) {
      result.set(id, latLng)
    }
  }

  return result
}

function randomPointInPolygon(poly: GeoPoly, rng: () => number): LatLng | null {
  const [minX, minY, maxX, maxY] = bbox(poly)
  for (let i = 0; i < 120; i++) {
    const lng = minX + rng() * (maxX - minX)
    const lat = minY + rng() * (maxY - minY)
    if (booleanPointInPolygon(point([lng, lat]), poly)) {
      return { lat, lng }
    }
  }
  return null
}

/** 在各国真实版图多边形内均匀分布节点（网格 + 最远点采样，减少重叠） */
export async function buildNodeLatLngMap(
  nodes: AnimationNode[],
): Promise<Map<string, LatLng>> {
  const regions = await loadCountryRegions()
  const byCountry = new Map<CountryCode, AnimationNode[]>()

  for (const node of nodes) {
    const list = byCountry.get(node.country) ?? []
    list.push(node)
    byCountry.set(node.country, list)
  }

  const result = new Map<string, LatLng>()

  for (const [country, list] of byCountry) {
    const polys = regions.get(country)
    if (!polys?.length) continue

    const placed = spreadNodesInCountry(list, polys)
    for (const [id, latLng] of placed) {
      result.set(id, latLng)
    }
  }

  return result
}

/** 单部作品快速落点（面板选中但不在地球批次内时使用） */
export async function resolveNodeLatLng(
  node: AnimationNode,
  cache: Map<string, LatLng>,
): Promise<LatLng | null> {
  const cached = cache.get(node.id)
  if (cached) return cached

  const regions = await loadCountryRegions()
  const polys = regions.get(node.country)
  if (!polys?.length) return null

  const rng = seededRng(`single:${node.id}`)
  for (let attempt = 0; attempt < 80; attempt++) {
    const poly = polys[Math.floor(rng() * polys.length)]!
    const pt = randomPointInPolygon(poly, rng)
    if (pt) {
      cache.set(node.id, pt)
      return pt
    }
  }
  return null
}

let outlineCache: Map<CountryCode, number[][][]> | null = null

export async function getCountryOutlineRings(): Promise<
  Map<CountryCode, number[][][]>
> {
  if (outlineCache) return outlineCache

  const topology = countries110m as unknown as Topology
  const collection = feature(
    topology,
    topology.objects.countries,
  ) as FeatureCollection

  const rings = new Map<CountryCode, number[][][]>()
  const pushRing = (code: CountryCode, ring: number[][]) => {
    if (ring.length < 3) return
    const list = rings.get(code) ?? []
    list.push(ring)
    rings.set(code, list)
  }

  for (const f of collection.features) {
    const name = f.properties?.name as string | undefined
    if (!name) continue

    const code = NATURAL_EARTH_TO_CODE[name]
    if (!code) continue

    const geom = f.geometry as Geometry
    if (geom.type === 'Polygon') {
      pushRing(code, geom.coordinates[0]!)
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((poly) => pushRing(code, poly[0]!))
    }
  }

  outlineCache = rings
  return rings
}

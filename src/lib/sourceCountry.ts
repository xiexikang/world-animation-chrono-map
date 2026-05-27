import type { LatLng } from '@/globe/geo'
import {
  DEFAULT_ORBIT_LIMITS,
  type GlobeOrbitLimits,
} from '@/globe/focusCamera'
import {
  getCountryGlobeCenter,
  getGlobeOrbitLimitsForRegion,
} from '@/globe/countryRegions'
import {
  isSourceCountryCode,
  SOURCE_COUNTRY_CODES,
  type CountryCode,
  type SourceCountryCode,
} from '@/types'

export { SOURCE_COUNTRY_CODES, type SourceCountryCode }

/** 在 10 国列表内则原样返回 ISO，否则 OTHER（非数据源 TMDB 出品国） */
export function sourceCountryToGlobeRegion(code: string): CountryCode {
  const upper = code.toUpperCase()
  return isSourceCountryCode(upper) ? (upper as SourceCountryCode) : 'OTHER'
}

export function sourceCountriesToGlobeRegions(codes: string[]): CountryCode[] {
  return [...new Set(codes.map(sourceCountryToGlobeRegion))]
}

const COMPACT_SOURCE_ORBIT: Partial<
  Record<SourceCountryCode, GlobeOrbitLimits>
> = {
  JP: { focusDistance: 1.58, minDistance: 1.42, maxDistance: 2.35 },
  KR: { focusDistance: 1.58, minDistance: 1.42, maxDistance: 2.35 },
  GB: { focusDistance: 1.65, minDistance: 1.44, maxDistance: 2.4 },
  IE: { focusDistance: 1.65, minDistance: 1.44, maxDistance: 2.4 },
  BE: { focusDistance: 1.62, minDistance: 1.43, maxDistance: 2.38 },
  CZ: { focusDistance: 1.62, minDistance: 1.43, maxDistance: 2.38 },
  FI: { focusDistance: 1.68, minDistance: 1.45, maxDistance: 2.42 },
  CN: { focusDistance: 1.72, minDistance: 1.48, maxDistance: 2.5 },
  FR: { focusDistance: 1.7, minDistance: 1.47, maxDistance: 2.48 },
}

export async function getSourceCountryGlobeCenter(code: string): Promise<LatLng> {
  const region = sourceCountryToGlobeRegion(code)
  if (region !== 'OTHER') {
    return getCountryGlobeCenter(region)
  }
  return { lat: 20, lng: 0 }
}

export async function getSourceCountryGlobeView(code: string): Promise<{
  center: LatLng
  orbit: GlobeOrbitLimits
}> {
  const upper = code.toUpperCase()
  const center = await getSourceCountryGlobeCenter(upper)
  if (isSourceCountryCode(upper)) {
    const compact = COMPACT_SOURCE_ORBIT[upper]
    if (compact) return { center, orbit: compact }
    const orbit = await getGlobeOrbitLimitsForRegion(upper)
    return { center, orbit }
  }
  return { center, orbit: DEFAULT_ORBIT_LIMITS }
}

export function nodeMatchesSourceCountry(
  node: { countryCode?: string; country: CountryCode },
  sourceCode: string,
): boolean {
  const code = sourceCode.toUpperCase()
  if (node.countryCode) {
    return node.countryCode.toUpperCase() === code
  }
  return sourceCountryToGlobeRegion(code) === node.country
}

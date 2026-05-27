import type { LatLng } from '@/globe/geo'
import { CHINA_GLOBE_CENTER } from '@/globe/focusCamera'
import { getCountryGlobeCenter } from '@/globe/countryRegions'
import type { CountryCode } from '@/types'

/** 数据源国家码 → 地球版图区域（用于节点落点与轮廓高亮） */
const SOURCE_TO_GLOBE_REGION: Record<string, CountryCode> = {
  CN: 'CN',
  JP: 'JP',
  US: 'US',
  GB: 'UK',
  IE: 'UK',
  FR: 'EU',
  BE: 'EU',
  FI: 'EU',
  CZ: 'EU',
  RU: 'EU',
  KR: 'OTHER',
}

/** 无对应版图区域时的相机对准点 */
const SOURCE_GLOBE_CENTERS: Record<string, LatLng> = {
  CN: CHINA_GLOBE_CENTER,
  JP: { lat: 36, lng: 138 },
  US: { lat: 39, lng: -98 },
  GB: { lat: 54, lng: -2 },
  IE: { lat: 53.5, lng: -8 },
  FR: { lat: 46.5, lng: 2.5 },
  BE: { lat: 50.5, lng: 4.5 },
  CZ: { lat: 49.8, lng: 15.5 },
  FI: { lat: 64, lng: 26 },
  KR: { lat: 36.5, lng: 127.5 },
}

export function sourceCountryToGlobeRegion(code: string): CountryCode {
  return SOURCE_TO_GLOBE_REGION[code.toUpperCase()] ?? 'OTHER'
}

export function sourceCountriesToGlobeRegions(codes: string[]): CountryCode[] {
  return [...new Set(codes.map(sourceCountryToGlobeRegion))]
}

export async function getSourceCountryGlobeCenter(code: string): Promise<LatLng> {
  const upper = code.toUpperCase()
  const region = sourceCountryToGlobeRegion(upper)
  if (region !== 'OTHER') {
    return getCountryGlobeCenter(region)
  }
  return SOURCE_GLOBE_CENTERS[upper] ?? { lat: 20, lng: 0 }
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

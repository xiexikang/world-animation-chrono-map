import type { AnimationNode, CountryCode } from '@/types'

/** 源数据国家码 → 项目地域码（与 import-covers.mjs 一致） */
const SOURCE_COUNTRY_MAP: Record<string, CountryCode> = {
  CN: 'CN',
  JP: 'JP',
  US: 'US',
  FR: 'EU',
  BE: 'EU',
  FI: 'EU',
  RU: 'EU',
  GB: 'UK',
  IE: 'UK',
}

const VALID_CODES = new Set<CountryCode>([
  'CN',
  'JP',
  'US',
  'EU',
  'UK',
  'OTHER',
])

const ERA_YEAR: Record<string, number> = {
  '60': 1960,
  '70': 1970,
  '80': 1980,
  '90': 1990,
  '00': 2000,
  '10': 2010,
  '20': 2020,
}

function mapCountry(raw: string | undefined): CountryCode {
  if (!raw) return 'OTHER'
  const mapped = SOURCE_COUNTRY_MAP[raw]
  if (mapped) return mapped
  if (VALID_CODES.has(raw as CountryCode)) return raw as CountryCode
  return 'OTHER'
}

/** 加载 JSON 时统一 id、国家码、年代年份 */
export function normalizeNode(
  raw: AnimationNode & { id: string | number; country?: string },
): AnimationNode {
  const era = String(raw.era ?? '')
  return {
    ...raw,
    id: String(raw.id),
    country: mapCountry(raw.country),
    era,
    year: raw.year ?? ERA_YEAR[era],
  }
}

export function normalizeNodes(
  nodes: (AnimationNode & { id: string | number })[],
): AnimationNode[] {
  return nodes.map(normalizeNode)
}

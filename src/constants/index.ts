import type { CountryCode } from '@/types'
import { SOURCE_COUNTRY_CODES } from '@/types'

export const COLORS = {
  bg: 0x0b0b0e,
  accent: 0xff6b01,
} as const

/** 地球绘制与节点徽章用的国家列表（含 OTHER 兜底） */
export const GLOBE_COUNTRY_CODES: CountryCode[] = [
  ...SOURCE_COUNTRY_CODES,
  'OTHER',
]

export const COUNTRY_LABELS: Record<
  CountryCode,
  { label: string; flag: string; en: string }
> = {
  BE: { label: '比利时', flag: '🇧🇪', en: 'Belgium' },
  CN: { label: '中国', flag: '🇨🇳', en: 'China' },
  CZ: { label: '捷克', flag: '🇨🇿', en: 'Czechia' },
  FI: { label: '芬兰', flag: '🇫🇮', en: 'Finland' },
  FR: { label: '法国', flag: '🇫🇷', en: 'France' },
  GB: { label: '英国', flag: '🇬🇧', en: 'UK' },
  IE: { label: '爱尔兰', flag: '🇮🇪', en: 'Ireland' },
  JP: { label: '日本', flag: '🇯🇵', en: 'Japan' },
  KR: { label: '韩国', flag: '🇰🇷', en: 'Korea' },
  US: { label: '美国', flag: '🇺🇸', en: 'USA' },
  OTHER: { label: '其他', flag: '🌍', en: 'Other' },
}

/** 年代筛选 */
export const ERA_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: '全部年代' },
  { value: '60', label: '60 年代' },
  { value: '70', label: '70 年代' },
  { value: '80', label: '80 年代' },
  { value: '90', label: '90 年代' },
  { value: '00', label: '00 年代' },
  { value: '10', label: '10 年代' },
  { value: '20', label: '20 年代' },
]

export function eraLabel(era: string): string {
  if (era === 'all') return '全部年代'
  const found = ERA_OPTIONS.find((o) => o.value === era)
  return found?.label ?? `${era} 年代`
}

const THEME_PALETTE = [
  '#FF6B01',
  '#8B5CF6',
  '#10B981',
  '#3B82F6',
  '#EF4444',
  '#F59E0B',
  '#6B7280',
  '#EC4899',
  '#14B8A6',
  '#374151',
]

export function themeColor(theme: string): string {
  let hash = 0
  for (let i = 0; i < theme.length; i++) {
    hash = theme.charCodeAt(i) + ((hash << 5) - hash)
  }
  return THEME_PALETTE[Math.abs(hash) % THEME_PALETTE.length]!
}

export const COUNTRY_NODE_COLORS: Record<CountryCode, number> = {
  BE: 0xf59e0b,
  CN: 0xffc800,
  CZ: 0xec4899,
  FI: 0x14b8a6,
  FR: 0x2dd4a0,
  GB: 0xb48cff,
  IE: 0x22c55e,
  JP: 0xff5050,
  KR: 0xa855f7,
  US: 0x3b9eff,
  OTHER: 0x9ca3af,
}

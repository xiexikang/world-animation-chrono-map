import type { CountryCode } from '@/types'

export const COLORS = {
  bg: 0x0b0b0e,
  accent: 0xff6b01,
} as const

export const COUNTRY_LABELS: Record<
  CountryCode,
  { label: string; flag: string; en: string }
> = {
  CN: { label: '中国', flag: '🇨🇳', en: 'China' },
  JP: { label: '日本', flag: '🇯🇵', en: 'Japan' },
  US: { label: '美国', flag: '🇺🇸', en: 'USA' },
  EU: { label: '欧洲', flag: '🇪🇺', en: 'Europe' },
  UK: { label: '英国', flag: '🇬🇧', en: 'UK' },
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
  CN: 0xffc800,
  JP: 0xff5050,
  US: 0x3b9eff,
  EU: 0x2dd4a0,
  UK: 0xb48cff,
  OTHER: 0x9ca3af,
}

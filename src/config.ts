/** 后端 API 根路径，末尾无斜杠；空字符串表示同源（开发走 Vite 代理） */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/$/,
  '',
)

function envFlag(value: string | undefined, defaultEnabled: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultEnabled
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

/**
 * 是否在首屏当前国就绪后，空闲预拉其余国家（见 VITE_ENABLE_COUNTRY_PREFETCH）。
 * 默认开启。
 */
export const COUNTRY_PREFETCH_ENABLED = envFlag(
  import.meta.env.VITE_ENABLE_COUNTRY_PREFETCH,
  true,
)

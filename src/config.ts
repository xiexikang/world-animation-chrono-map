/** 后端 API 根路径，末尾无斜杠；空字符串表示同源（开发走 Vite 代理） */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/$/,
  '',
)

export const USE_STATIC_DATA =
  import.meta.env.VITE_USE_STATIC_DATA === 'true' ||
  import.meta.env.VITE_USE_STATIC_DATA === '1'

/** 后端 API 根路径，末尾无斜杠；空字符串表示同源（开发走 Vite 代理） */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/$/,
  '',
)

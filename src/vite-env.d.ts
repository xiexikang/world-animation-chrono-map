/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 根地址，开发留空走 Vite `/api` 代理 */
  readonly VITE_API_BASE_URL?: string
  /** 为 `true` 时仍从本地 animationData.json 加载（无后端时调试用） */
  readonly VITE_USE_STATIC_DATA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

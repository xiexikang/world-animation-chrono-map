/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 根地址，开发留空走 Vite `/api` 代理 */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

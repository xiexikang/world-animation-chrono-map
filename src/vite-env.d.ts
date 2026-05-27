/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 根地址，开发留空走 Vite `/api` 代理 */
  readonly VITE_API_BASE_URL?: string
  /** 是否空闲预拉除当前国外的其余国家；默认 true，设为 false 关闭 */
  readonly VITE_ENABLE_COUNTRY_PREFETCH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

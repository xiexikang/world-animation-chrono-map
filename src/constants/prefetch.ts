/** 首屏当前国加载完成后，空闲时预拉的国家（按顺序、一次一国） */
export const PREFETCH_COUNTRY_CODES = ['JP', 'US'] as const

/** requestIdleCallback 最长等待（毫秒） */
export const PREFETCH_IDLE_TIMEOUT_MS = 8_000

/** 无 idle API 时的延迟启动 */
export const PREFETCH_FALLBACK_DELAY_MS = 3_000

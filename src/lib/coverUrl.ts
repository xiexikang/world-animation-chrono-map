/** 开发环境经 Vite 代理加载外链封面，避免 Wikimedia 等 CORS 限制 */
export function resolveCoverUrl(url: string): string {
  if (!url || url.startsWith('/') || url.startsWith('data:')) return url
  if (!import.meta.env.DEV) return url

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('wikimedia.org')) {
      return `/cover-proxy${parsed.pathname}${parsed.search}`
    }
    if (parsed.hostname === 'placehold.co') {
      return `/placehold-proxy${parsed.pathname}${parsed.search}`
    }
  } catch {
    /* ignore */
  }
  return url
}

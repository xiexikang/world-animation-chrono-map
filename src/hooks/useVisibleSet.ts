import { useAppStore } from '@/store'

/** 订阅 store 内缓存的可见 id 集合 */
export function useVisibleSet(): Set<string> {
  return useAppStore((s) => s.visibleIds)
}

export function useVisibleCount(): number {
  return useAppStore((s) => s.visibleCount)
}

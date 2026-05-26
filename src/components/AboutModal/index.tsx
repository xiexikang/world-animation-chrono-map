import { useAppStore } from '@/store'

export function AboutModal() {
  const open = useAppStore((s) => s.aboutOpen)
  const setAboutOpen = useAppStore((s) => s.setAboutOpen)

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/40"
        aria-label="关闭关于"
        onClick={() => setAboutOpen(false)}
      />
      <dialog
        open
        className="glass-panel fixed top-1/2 left-1/2 z-50 w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl p-5 text-sm leading-relaxed text-text shadow-xl"
        aria-labelledby="about-title"
      >
        <h2 id="about-title" className="mb-3 text-lg font-bold text-accent">
          世界动画时空地图
        </h2>
        <p className="text-text-muted">
          以可旋转的 3D 世界地球呈现动画 IP。每个节点落在你所选国家的真实版图范围内（而非精确 GPS 坐标），效果类似参考图中的「国旗区域内铺满头像」。
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-text-muted">
          <li>拖拽旋转地球，滚轮缩放</li>
          <li>中国节点在中国版图内，日本/美国/欧洲等同理</li>
          <li>右侧选国家可高亮该国边界</li>
        </ul>
        <button
          type="button"
          className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-medium text-bg hover:opacity-90"
          onClick={() => setAboutOpen(false)}
        >
          知道了
        </button>
      </dialog>
    </>
  )
}

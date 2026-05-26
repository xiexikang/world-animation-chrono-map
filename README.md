# 世界动画时空地图 · World Animation Chrono-Map

可 **拖拽旋转** 的 3D 世界地球，动画节点按出品国家落在对应地理位置。

## 技术栈

| 层级 | 选型 |
|------|------|
| 包管理 | pnpm 8.x |
| 构建 | Vite 8.x |
| 框架 | React 18.x |
| 3D | Three.js + React Three Fiber + Drei |
| 状态 | Zustand 5.x |

## 开发

```bash
pnpm install
pnpm dev
```

## 交互

- **拖拽**：旋转地球
- **滚轮**：缩放
- **右侧国旗**：国家筛选（多选 OR）
- **左侧主题 / 底部年代**：时间与主题筛选
- **点击节点**：聚焦该国区域 + 详情卡
- **复位视图**：恢复默认相机

## 数据（当前调试：中国 10 条）

- `public/data/nodes.json` — **10 条 CN** 动画元数据
- `public/covers/cn-01.svg` … `cn-10.svg` — 本地封面（可替换为 `.webp` / `.jpg`，并改 JSON 里 `cover` 路径）

重新生成 CN 10 条占位数据：

```bash
node scripts/setup-cn10-local.mjs
```

节点 `country` 字段决定地球上的大致经纬度位置（同国多作品自动分散）。

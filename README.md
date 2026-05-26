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

## 数据

- `src/data/animationData.json` — TMDB 原始结构（与 `raw_anime_CN.json` 同 schema），**前端启动时加载并转换**
- `src/data/raw_anime_CN.json` — 中国动画源数据；同步到 animationData：`pnpm data:sync-animation`
- `public/data/nodes.json` — 可选导出（`pnpm data:tmdb-to-nodes`），运行时不再使用

从 TMDB 源同步 animationData：

```bash
pnpm data:sync-animation
```

节点 `country` 字段决定地球上的大致经纬度位置（同国多作品自动分散）。

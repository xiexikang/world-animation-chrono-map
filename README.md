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

- **运行时**：默认从后端 `POST /api/animes` 分页拉取全量数据（开发走 Vite `/api` 代理 → `http://127.0.0.1:8110`）
- `src/data/animationData.json` — 本地 TMDB 结构备份；设置 `VITE_USE_STATIC_DATA=true` 时可离线加载
- `src/data/raw_anime_CN.json` — 中国动画源数据；同步到 animationData：`pnpm data:sync-animation`
- `public/data/nodes.json` — 可选导出（`pnpm data:tmdb-to-nodes`），运行时不再使用

### 对接后端

1. 启动后端（见 `world-animation-chrono-map-backend` README，端口 8110）
2. 前端：`cp .env.example .env`（一般无需改，开发用代理即可）
3. `pnpm dev` — 访问 http://localhost:2500

生产构建时在 `.env` 中设置 `VITE_API_BASE_URL` 为后端公网地址。

从 TMDB 源同步本地 animationData（仅离线模式需要）：

```bash
pnpm data:sync-animation
```

节点 `country` 字段决定地球上的大致经纬度位置（同国多作品自动分散）。

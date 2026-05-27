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

需先启动后端（`world-animation-chrono-map-backend`，默认端口 8110）。

## 交互

- **拖拽**：旋转地球
- **滚轮**：缩放
- **右侧国家**：国家筛选（数据来自 `GET /api/countries`）
- **左侧主题 / 底部年代**：时间与主题筛选（主题来自 `GET /api/themes`）
- **点击节点**：聚焦该国区域 + 详情卡
- **复位视图**：恢复默认相机

## 数据接口

| 接口 | 用途 |
|------|------|
| `POST /api/animes` | 分页拉取动画列表 |
| `GET /api/countries` | 国家分类 |
| `GET /api/themes` | 主题字典（`genre_ids` → 中文主题） |

开发环境通过 Vite 将 `/api` 代理到 `http://127.0.0.1:8110`。生产构建在 `.env` 中设置 `VITE_API_BASE_URL` 为后端公网地址。

节点 `country` 字段决定地球上的大致经纬度位置（同国多作品自动分散）。

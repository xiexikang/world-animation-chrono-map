# 世界动画时空地图 · World Animation Chrono-Map

可 **拖拽旋转** 的 3D 世界地球，动画节点按出品国家落在对应地理位置。


## 体验地址
https://world-animation-chrono-map-web.xiexk.cn/

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
| `POST /api/animes/meta` | 列表元信息（条数 / 最大更新时间，供本地缓存校验） |
| `GET /api/countries` | 国家分类 |
| `GET /api/countries/stats` | 各国作品数量（侧栏展示） |
| `GET /api/themes` | 主题字典（`genre_ids` → 中文主题） |

开发环境通过 Vite 将 `/api` 代理到 `http://127.0.0.1:8110`。生产构建在 `.env` 中设置 `VITE_API_BASE_URL` 为后端公网地址。

节点 `country` 字段决定地球上的大致经纬度位置（同国多作品自动分散）。

## 本地缓存

- 按**国家分片**（或全球 `__ALL__`）写入 **IndexedDB**；年代/主题/搜索仅在客户端筛选
- 二次打开先读缓存再请求 `POST /api/animes/meta` 校验
- 校验通过则不再拉全量；数据变更或超过 24h 则后台重新同步
- 首屏可交互后，顶部会显示**后台同步**进度条
- 默认展示 **CN**；可在 `.env` 用 `VITE_ENABLE_COUNTRY_PREFETCH=false` 关闭空闲预拉
- 开启时：CN 就绪后按 **countries/stats** 预拉其余国家（作品数多的优先，不占用同步进度条）
- 分页合并时延迟排序，整国加载完成后再统一 `sortNodesByDate`

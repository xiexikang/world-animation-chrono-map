# 世界动画时空地图 · World Animation Chrono-Map

可拖拽旋转的 3D 世界地球，动画节点按出品国家落在对应地理位置。

## 体验地址

<https://world-animation-chrono-map-web.xiexk.cn/>

## 项目结构

```text
.
├─ src/          # 前端（Vite + React + TypeScript）
├─ public/
├─ backend/      # 后端（FastAPI + MySQL）
└─ docs/
```

## 技术栈

| 层级 | 选型 |
|------|------|
| 前端包管理 | pnpm 8.x |
| 前端构建 | Vite 8.x |
| 前端框架 | React 18.x |
| 3D | Three.js + React Three Fiber + Drei |
| 状态 | Zustand 5.x |
| 后端 | FastAPI |
| 数据库 | MySQL 8.x |

## 本地开发

### 1. 安装前端依赖

```bash
pnpm install
```

也可以直接运行一键初始化提示脚本：

```bash
pnpm setup:dev
```

### 2. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

编辑 `backend/.env`，填写 MySQL 连接信息。

### 3. 初始化数据库

```bash
cd backend
mysql -u root -p < sql/init_anime.sql
mysql -u root -p < sql/init_country.sql
mysql -u root -p < sql/init_theme.sql
```

### 4. 启动命令

```bash
pnpm dev
```

默认等同于：

```bash
pnpm dev:frontend
```

单独启动前端：

```bash
pnpm dev:frontend
```

单独启动后端：

```bash
pnpm dev:backend
```

同时启动前后端：

```bash
pnpm dev:all
```

开发环境下：

- 前端地址：<http://127.0.0.1:2500>
- 后端地址：<http://127.0.0.1:8110>
- API 文档：<http://127.0.0.1:8110/docs>

前端开发环境通过 Vite 将 `/api` 代理到 `http://127.0.0.1:8110`。

## 交互

- 拖拽：旋转地球
- 滚轮：缩放
- 右侧国家：国家筛选（数据来自 `GET /api/countries`）
- 左侧主题 / 底部年代：时间与主题筛选（主题来自 `GET /api/themes`）
- 点击节点：聚焦该国区域 + 详情卡
- 复位视图：恢复默认相机

## 数据接口

| 接口 | 用途 |
|------|------|
| `POST /api/animes` | 分页拉取动画列表 |
| `POST /api/animes/meta` | 列表元信息（条数 / 最大更新时间，供本地缓存校验） |
| `GET /api/countries` | 国家分类 |
| `GET /api/countries/stats` | 各国作品数量（侧栏展示） |
| `GET /api/themes` | 主题字典（`genre_ids` → 中文主题） |

## 本地缓存

- 按国家分片（或全球 `__ALL__`）写入 IndexedDB；年代、主题、搜索仅在客户端筛选
- 二次打开先读缓存，再请求 `POST /api/animes/meta` 校验
- 校验通过则不再拉全量；数据变更或超过 24 小时则后台重新同步
- 首屏可交互后，顶部会显示后台同步进度条
- 默认展示 `CN`；可在根目录 `.env` 用 `VITE_ENABLE_COUNTRY_PREFETCH=false` 关闭空闲预拉
- 开启时：`CN` 就绪后按 `countries/stats` 预拉其余国家（作品数多的优先，不占用同步进度条）

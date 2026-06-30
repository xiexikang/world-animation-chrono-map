# world-animation-chrono-map-backend

世界动画地图 — 后端服务（FastAPI + MySQL）

## 环境要求

- Python 3.11+
- MySQL 8.0+

## 快速开始

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 MySQL 连接信息

# 3. 初始化数据库（若尚未建表）
mysql -u root -p < sql/init_anime.sql
mysql -u root -p < sql/init_country.sql
mysql -u root -p < sql/init_theme.sql

# 4. 启动服务（端口 8110）
uvicorn app.main:app --host 0.0.0.0 --port 8110 --reload
```

API 文档：http://127.0.0.1:8110/docs

## 白名单访问

在 `.env` 中配置：

| 变量 | 说明 |
|------|------|
| `WHITELIST_ENABLED` | `true` 开启白名单，默认 `false` |
| `WHITELIST_IPS` | 允许的客户端 IP，逗号分隔 |
| `WHITELIST_ORIGINS` | 允许的前端来源，逗号分隔（匹配 `Origin` / `Referer`） |
| `TRUST_PROXY` | 网关后部署时设为 `true`，从 `X-Forwarded-For` 读取真实 IP |

规则：开启后，请求 IP **或** 来源域名任一命中即放行（服务端调用走 IP，浏览器走 Origin）。

以下路径不受白名单限制：`/health`、`/docs`、`/redoc`、`/openapi.json`

生产示例：

```env
WHITELIST_ENABLED=true
WHITELIST_IPS=127.0.0.1,::1,192.168.1.100
WHITELIST_ORIGINS=https://your-frontend.com
TRUST_PROXY=true
```

## 接口

### POST /api/animes — 获取动画列表

**请求体**

```json
{
  "page": 1,
  "page_size": 20,
  "keyword": "火影",
  "country_code": "JP",
  "genre_id": 16,
  "decade": 90,
  "sort_by": "popularity",
  "sort_order": "desc"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 20，最大 100 |
| keyword | string | 否 | 关键词，匹配 name / original_name |
| country_code | string | 否 | 国家代码，如 CN / JP / US |
| genre_id | int | 否 | TMDB 类型 ID（如 16=动画），在 genre_ids JSON 数组中匹配 |
| decade | int | 否 | 年代码，按 `first_air_date` 年份区间筛选（见下表） |

**年代对照**

| decade | 年份区间 |
|--------|----------|
| 70 | 1970–1979 |
| 80 | 1980–1989 |
| 90 | 1990–1999 |
| 0（00 年代） | 2000–2009 |
| 10 | 2010–2019 |
| 20 | 2020–2029 |

> JSON 中 `00` 年代请传数字 `0`。
| sort_by | string | 否 | 排序字段：popularity / vote_average / first_air_date / created_at |
| sort_order | string | 否 | asc / desc，默认 desc |

默认过滤 `adult=1` 与 `softcore=1` 的记录。

### POST /api/animes/meta — 列表元信息（缓存校验）

请求体与列表筛选相同（`page` / `page_size` 可省略），用于前端 IndexedDB 校验是否需重新拉取全量数据。

**响应 `data`**

| 字段 | 说明 |
|------|------|
| total | 符合筛选条件的总条数 |
| max_updated_at | 符合条件记录的最大 `updated_at`，无数据时为 `null` |

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 0,
      "total_pages": 0
    }
  }
}
```

### GET /api/countries — 获取国家分类列表

按 `sort_order` 升序返回全部国家分类（数据来自 `country` 表）。

### GET /api/countries/stats — 各国作品数量

返回 `anime` 表中（已过滤 adult/softcore）按 `country_code` 分组的数量，供前端国家列表展示，无需拉取全量动画。

**示例**

```
GET /api/countries
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "code": "CN",
      "name": "中国",
      "sort_order": 1,
      "created_at": "2026-05-27T00:00:00",
      "updated_at": "2026-05-27T00:00:00"
    }
  ]
}
```

建表与初始数据见 `sql/init_country.sql`。

### GET /api/themes — 获取主题字典

按 `sort_order` 升序返回 TMDB 类型 ID 与中文主题名（数据来自 `theme` 表）。

| 字段 | 说明 |
|------|------|
| tmdb_genre_id | TMDB 类型 ID，对应 `anime.genre_ids` 中的元素 |
| name | 中文主题名 |
| sort_order | 展示排序 |
| show_in_tags | `true` 时参与前端主题标签与筛选；`false` 时仅作元数据（如「动画」） |

**示例**

```
GET /api/themes
```

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "tmdb_genre_id": 10759,
      "name": "动作冒险",
      "sort_order": 2,
      "show_in_tags": true,
      "created_at": "2026-05-27T00:00:00",
      "updated_at": "2026-05-27T00:00:00"
    }
  ]
}
```

建表与初始数据见 `sql/init_theme.sql`。

### GET /api/animes/{tmdb_id}/{country_code} — 获取动画详情

**路径参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tmdb_id | int | 是 | TMDB TV 条目 ID |
| country_code | string | 是 | 数据来源国家代码，如 CN / JP / US（不区分大小写） |

**示例**

```
GET /api/animes/12345/JP
```

主键为 `(tmdb_id, country_code)`，同一 TMDB 条目在不同国家数据源下可能各有一条记录，详情需与列表项保持一致一并传入。

记录不存在或为 `adult` / `softcore` 内容时返回 **404**。

**响应示例**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "tmdb_id": 12345,
    "country_code": "JP",
    "name": "...",
    "original_name": "...",
    "overview": "...",
    "full_poster_path": "...",
    "popularity": 85.5,
    "vote_average": 8.2,
    "first_air_date": "2020-01-01",
    "genre_ids": [16],
    "origin_country": ["JP"]
  }
}
```

### GET /health — 健康检查

```json
{"status": "ok"}
```

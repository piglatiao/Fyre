# 动态模块（说说）实施方案 · R1

> 状态：待用户审核批准后实施
> 日期：2026-10-16
> 依据：官网 https://firefly.cuteleaf.cn 实测（2026-10-16 夜间）

## 一、背景与目标

官网右栏与独立页面都有一个「动态」模块，我们目前缺失。本方案将其对齐官网，使首页右栏由「最新文章」换成「最新动态」，并新增 `/dynamic/` 列表页与后台管理，全部内容可在后台维护。

### 官网实测证据

1. `GET https://firefly.cuteleaf.cn/api/dynamic.json` 返回条目数组，实测 4 条，字段：
   - `id`（如 "2026-07-15-021127"）、`published`（毫秒时间戳）
   - `html`（已渲染的正文 HTML）、`searchText`（搜索用纯文本）
   - `images`：`[{ "alt": "图片1", "src": "..." }]`（可为空数组）
   - `pinned`（置顶布尔）、`location`（位置文本，可为空字符串）
2. `/dynamic/` 页面结构：
   - 页头横幅标题「动态」；
   - 中部卡片头：绿色圆角图标 + 标题「动态」+ 副标题「随手记下此刻的想法与日常。」+ 右侧计数「N 动态」；下方一行：搜索框「搜索动态...」+ 年份下拉「全部年份」；
   - 条目卡：圆头像 + 昵称 + 时间（`2026/07/15 02:11:27 UTC+8`）+ 位置（如「广西」，有才显示）+ 置顶徽标 + 正文 + 图片网格（可点击查看大图）。
3. 首页右栏 `widget-layout[data-id="latest-dynamics"]`：
   - 标题「最新动态」（带官网统一的主色小竖条标题样式）；
   - 条目：时间（`2026-07-15 02:11:27` 样式，带钟表图标）+ 置顶徽标 + 摘要（截断）；
   - 底部「更多动态」链接（带计数）指向 `/dynamic/`；
   - 右栏顺序：最新动态 → 站点统计 → 站点信息。

## 二、数据模型（Prisma / MySQL，新增迁移 add_dynamic）

```prisma
// 动态（说说）：后台维护的短内容，支持图片、位置、置顶与定时可见
model Dynamic {
  id          Int      @id @default(autoincrement())
  content     String   @db.LongText           // Markdown 原文，渲染复用现有 unified 链路
  images      Json                            // [{alt, src}]，src 复用媒体库地址
  location    String   @db.VarChar(64)        // 位置文本，可空串
  pinned      Boolean  @default(false)        // 置顶
  publishedAt DateTime                        // 发布时间（UTC）；未来时间前台不展示（懒生效）
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([pinned, publishedAt])
}
```

- 正文渲染与安全过滤复用 `src/lib/markdown.ts`（与文章、/api/preview 同一实现）。
- 时间存 UTC，展示 Asia/Shanghai（与文章一致）。
- 排序：`pinned desc, publishedAt desc`。

## 三、文件清单

### 新增（18 个）

| 文件 | 职责 |
| --- | --- |
| `src/types/dynamic-entry.ts` | 前台条目类型（html 已渲染、images、location、pinned、publishedAt） |
| `src/types/admin-dynamic-entry.ts` | 后台条目类型（含 Markdown 原文、createdAt） |
| `src/server/repositories/dynamic.repository.interface.ts` | 前台仓储接口 |
| `src/server/repositories/dynamic.repository.ts` | 前台仓储实现（公开列表/年份/最近 N 条/计数） |
| `src/server/repositories/admin-dynamic.repository.interface.ts` | 后台仓储接口 |
| `src/server/repositories/admin-dynamic.repository.ts` | 后台仓储实现（分页列表/按 id/增删改） |
| `src/server/services/dynamic.service.interface.ts` | 前台服务接口 |
| `src/server/services/dynamic.service.ts` | 前台服务实现（渲染 Markdown、年份聚合、置顶排序） |
| `src/server/services/admin-dynamic.service.interface.ts` | 后台服务接口 |
| `src/server/services/admin-dynamic.service.ts` | 后台服务实现（校验、图片地址检查、发布/更新时间处理） |
| `src/server/validators/dynamic.schema.ts` | zod 校验（content 1~5000 字、images ≤9、location ≤64、pinned、publishedAt） |
| `src/app/api/dynamics/route.ts` | GET 公开列表（?year=&q=&limit=）/ POST 新建（需登录） |
| `src/app/api/dynamics/[id]/route.ts` | PATCH 更新 / DELETE 删除（需登录） |
| `src/app/admin/(protected)/dynamics/page.tsx` | 后台动态管理页（服务端取数 + 渲染管理器） |
| `src/components/admin/dynamics-manager.tsx` | 后台管理界面（列表、编辑器弹窗、置顶/删除） |
| `src/components/site/sidebar/latest-dynamics-card.tsx` | 首页右栏「最新动态」卡（对齐官网） |
| `src/app/(site)/dynamic/page.tsx` | 前台 /dynamic 列表页（搜索 + 年份筛选 + 条目卡） |
| `src/components/site/dynamic-gallery.tsx` | 条目图片点击查看大图（Esc/左右切换） |

### 修改（5 个）

| 文件 | 改动 |
| --- | --- |
| `prisma/schema.prisma` | 追加 model Dynamic |
| `prisma/seed.ts` | 追加 3 条示例动态（上线公告 / 功能提示 / 欢迎语） |
| `src/server/services/service-container.ts` | 装配 DynamicService 与 AdminDynamicService |
| `src/app/(site)/layout.tsx` | 右栏「最新文章」→「最新动态」（对齐官网顺序与内容） |
| `src/components/admin/admin-sidebar.tsx` | 导航新增「动态」入口（MessageSquare 图标） |

### 复用的既有实现

- 鉴权：`getAdminSession()`（写操作一律先鉴权，未登录 401）+ `src/proxy.ts` 页面保护。
- 响应封装：`okResponse` / `errorResponse` / `handleApiError` / `readJson`。
- 编辑器：`src/components/admin/markdown-editor.tsx`（分栏编辑 + 服务端实时预览 + 上传插图）。
- 图片选择：`src/components/admin/media-picker-dialog.tsx`。
- 页面横幅标题：`src/components/site/page-banner-overlay.tsx`；分类快捷条：`category-bar.tsx`。
- 侧栏卡片容器：`widget-card.tsx`（标题主色小竖条样式已对齐官网）。

## 四、接口设计（统一 JSON：成功 `{ok:true,data}`，失败 `{ok:false,error:{code,message}}`）

| 方法/路径 | 鉴权 | 说明 |
| --- | --- | --- |
| GET `/api/dynamics?year=&q=&limit=` | 公开 | 仅返回 `publishedAt <= now` 的条目；`year` 按年过滤；`q` 对正文/位置做 contains；置顶优先、时间倒序 |
| POST `/api/dynamics` | 登录 | 新建（zod 校验；publishedAt 默认当前时间） |
| PATCH `/api/dynamics/[id]` | 登录 | 更新任意字段 |
| DELETE `/api/dynamics/[id]` | 登录 | 删除 |

## 五、前台呈现

1. 右栏「最新动态」卡：最新 2 条；每行 = 钟表图标 + `yyyy-MM-dd HH:mm:ss`（Asia/Shanghai）+ 置顶徽标 + 摘要（约 2 行截断）；底部「更多动态 + 计数」→ `/dynamic/`。
2. `/dynamic/` 页面：
   - 页头横幅标题「动态」（复用 PageBannerOverlay）；
   - 卡片头：图标 + 「动态」+ 副标题（默认「随手记下此刻的想法与日常。」）+ 计数；搜索框 + 年份下拉（GET 提交，?q=&year=）；
   - 条目卡：头像（`authorAvatar || siteLogo`）+ `authorName` + `yyyy/MM/dd HH:mm:ss UTC+8` + 位置 + 置顶徽标；正文（服务端渲染 HTML）；图片网格（点击放大）。
3. 导航：「动态 → /dynamic」通过后台「设置 → 导航」添加（验收时我负责加入，用户可自行调整）。
4. 无动态时右栏卡片自动隐藏（与现有卡片行为一致）。

## 六、后台管理

- 「动态」管理页：条目列表（正文摘要、时间、置顶、位置、图片数、编辑/删除）；
- 新建/编辑弹窗：MarkdownEditor + 图片选择（≤9 张，来自媒体库）+ 位置输入 + 置顶开关 + 发布时间（datetime-local，可选）；
- 所有写操作走 API，失败弹错但不破坏列表状态。

## 七、验收清单

1. `prisma migrate` + seed 成功，`prisma generate` 通过。
2. 后台新建含图片与位置的动态 → `/dynamic/` 与首页右栏即时可见（无需重启）。
3. 置顶条目前置；发布时间设为未来时前台不显示、后台可见。
4. 搜索关键词命中正文；年份下拉过滤正确。
5. 图片点击放大/关闭正常；时间显示为 UTC+8。
6. 未登录调用 POST/PATCH/DELETE 返回 401；非法输入（空正文、10 张图）被 zod 拒绝。
7. `pnpm exec tsc --noEmit` 与 `pnpm exec eslint` 通过；截图与官网 /dynamic/ 及右栏逐项对比。

## 八、明确不做（一期）

- Memos 外部服务集成（官网可选能力，依赖外部服务，与「不接对象存储」策略一致后再考虑）。
- 动态的独立 RSS/Atom、多作者、草稿态。
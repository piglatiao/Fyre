# 文章「系列」模块 · 实施方案 R1（待批准）

## 背景
- 官网导航含「系列」入口（`/series/`），文章页在「上下篇」之后有与「相关文章」并排（`md:grid-cols-2`）的「系列导航」卡：标题 + 折叠按钮 + 编号文章列表，当前篇高亮、其余可跳转（见 `docs/research/firefly.cuteleaf.cn-site/post-guide/pretty.html`，`series-nav` / `series-nav-toggle` 相关 DOM）。
- 我们已实现「相关文章」卡（本轮），系列是文章页最后一块缺口。

## 数据模型（1 处迁移）
- `prisma/schema.prisma`：`Post` 增加 `series String? @db.VarChar(60)`（系列名，可空），迁移名 `add_post_series`。
- 首期用字符串而非独立表：系列数量少、无独立元数据需求；后续要系列封面/简介时再升级为 `Series` 表（届时按 series 名回填）。
- 排序规则沿用官网：同一系列内按 `publishedAt` 升序编号，不加手动排序字段。

## 改动清单（3 新建 + 8 编辑）
- 新建 `src/components/site/series-nav-card.tsx`：官网同款「系列导航」卡（编号徽标 + 标题 + 当前篇高亮 + 折叠交互，折叠用 client 组件）。
- 新建 `src/app/(site)/series/page.tsx`：系列总览（每个系列一张卡：名称、篇数、最新时间、可折叠的文章列表）。
- 新建 `docs/` 无需新增；本方案即计划文档。
- `prisma/schema.prisma` + 迁移：如上。
- `src/types/post-detail.ts`、`src/types/post-summary.ts`：增加 `series: string | null`。
- `src/server/repositories/post.repository.ts`（+ interface）：行映射补 `series`；新增 `listSeries()`（已发布文章的 DISTINCT 系列 + 计数 + 最新发布时间）与 `listBySeries(series)`（按发布时间升序，供导航编号）。
- `src/server/services/post.service.ts`（+ interface）：`listSeries()`、`listSeriesPosts(series)`，均先落地定时发布。
- `src/server/validators/post.schema.ts`、`src/server/repositories/admin-post.repository.ts`、`src/server/services/admin-post.service.ts`：后台写入与读取 series 字段（trim、≤60 字符、可空）。
- `src/components/admin/post-editor.tsx`：编辑区新增「所属系列」文本输入（可留空）。
- `src/app/(site)/posts/[slug]/page.tsx`：有系列时把「相关文章」与「系列导航」放进 `md:grid-cols-2` 栅格（与官网一致），无系列时相关文章占满整行。
- `src/lib/site-nav.ts`：默认导航加入「系列」（后台导航配置可改）。

## 验收标准
- 后台给文章设置「所属系列」并保存 → 文章页出现系列导航卡：编号连续、当前篇高亮、可折叠、其余篇可跳转。
- `/series` 显示全部系列与篇数，折叠交互正常；无系列文章时页面显示空状态而不是报错。
- 无系列文章的文章页不出现空卡片，相关文章卡占满整行。
- `pnpm exec tsc --noEmit` 与 `eslint` 退出码 0；CDP 截图 + DOM 取证（编号顺序、当前篇高亮、折叠前后高度变化）。

## 待确认
1. 系列名用字符串字段（建议，首期最简）还是独立 `Series` 表？
2. 是否需要手动排序（`seriesOrder`）？首期建议不要，按发布时间排序与官网一致。
3. 导航「系列」默认项是否直接加进默认导航（后台可改）？

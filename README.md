# 流萤动态博客（Firefly Dynamic）

把静态的流萤（Firefly）主题重构为**前后台一体的纯动态博客**：服务端渲染的访客端 + 自带管理后台 + MySQL 数据库。后台发布即时生效，无需重新构建部署；支持定时发布、Markdown 编辑、媒体库、SEO 与 RSS / Atom 订阅。

## 技术栈

| 层次 | 选型 |
| --- | --- |
| 框架 | Next.js 16（App Router）+ React 19 + TypeScript（strict） |
| 样式 | Tailwind CSS 4 + next-themes（明暗主题） |
| 数据库 | MySQL 8 + Prisma 7（驱动适配器 `@prisma/adapter-mariadb`） |
| 鉴权 | Auth.js v5（Credentials + JWT + HttpOnly Cookie）+ bcryptjs |
| 内容渲染 | unified + remark-gfm + rehype-sanitize + rehype-pretty-code（Shiki）+ rehype-slug |
| 媒体处理 | sharp（非 GIF 图片自动转 WebP） |
| 校验 | zod 4 |
| 订阅 | feed（RSS 2.0 / Atom） |

## 功能一览

**访客端**：首页卡片流（置顶优先 + 分页）、文章详情（目录、代码高亮、上下篇、阅读数自增、站内评论）、分类页、标签页与标签云、归档页、搜索页与导航栏即时搜索、动态、项目、相册、友链、留言、书签导航、打赏、音乐与自定义页面；哔哩哔哩、Bangumi、VNDB、MyAnimeList 收藏页均支持统计、搜索、筛选、排序、分页与 NSFW 策略。全站提供分类胶囊栏、响应式布局、逐页 SEO metadata、`sitemap.xml`、`robots.txt`、RSS / Atom 与文章 JSON-LD。

**管理后台**：登录（5 次失败锁定 10 分钟）、仪表盘（内容模块与评论统计）、文章管理（筛选、批量删除、置顶、定时/草稿/私密）、分栏 Markdown 编辑器（实时服务端预览 + 图片上传插入）、分类管理（非空删除需先迁移文章）、标签管理（含合并）、页面、媒体、动态、项目、相册、友链、留言、评论管理（审核与状态筛选）、书签、打赏、音乐、媒体源配置、站点设置（站点信息、导航、社交、备案、SEO、评论）与账号密码维护；移动端提供抽屉式导航。

**安全与运维**：写操作全部服务端鉴权（`proxy.ts` + 后台布局双重校验）；修改密码后旧会话立即失效；上传类型白名单 + 10MB 限制 + 随机文件名防路径穿越；定时发布惰性生效并由服务器计划任务兜底；提供双平台部署文档与备份脚本。

## 兼容入口与订阅

- `/archive`、`/about` 分别兼容官网的归档与关于地址，内部对应 `/archives`、`/page/about`；
- 订阅入口为 `/rss`、`/rss.xml`、`/atom`、`/atom.xml`，站点地图为 `/sitemap.xml` 与 `/sitemap-index.xml`；
- 顶部导航支持站内即时搜索，输入停顿后直接在当前页浮层展示最多 5 条文章结果；更多结果仍可从 `/search?q=` 查看；
- 默认导航、分类胶囊栏与站点图标 `/favicon/firefly-32.png` 已与官网入口保持一致，导航内容仍可在后台调整。

## 后台显示与页面特效

- 后台「站点设置」集中维护外观与横幅：主题色相、默认明暗模式、卡片透明度、卡片边框与阴影、卡片背景跟随主题色；后两项默认关闭，关闭时保持原有卡片样式。
- 首页横幅标题、副标题与社交入口默认显示，可在「横幅与个人资料」中整体隐藏。
- 壁纸轮播支持桌面端与移动端分别配置，每端最多 10 张图片/GIF；移动端留空时复用桌面图片。切换间隔为 3-60 秒，默认 5 秒，渐变过渡默认开启。
- 轮播关闭、只配置一张图片或列表中没有图片时，继续使用原有单张横幅；视频横幅、封面与播放策略不变。页面隐藏时暂停轮播，访客系统开启「减少动态效果」时停止自动轮播与渐变。
- 樱花特效默认关闭；关闭时服务端不渲染组件，也不下发对应客户端脚本。开启后使用不拦截交互的固定 Canvas，页面隐藏时暂停，减少动态效果时不创建动画，沉浸式阅读时自动隐藏。

## 媒体收藏与评论

- 媒体收藏在后台「站点设置」分别配置 Bangumi、VNDB、MyAnimeList 的启用状态、用户标识、接口地址、每页条数、缓存时长与 NSFW 策略；NSFW 支持 `off`（原样展示）、`blur`（模糊封面）与 `hide`（隐藏条目）。
- 三个媒体源均采用超时、一次重试、进程内缓存与旧缓存回退；上游异常时优先展示最近一次成功数据。
- 评论直接保存到本站数据库，不依赖 GitHub、Giscus 或 Discussions，无需配置外部仓库与分类。
- 评论区默认在文章、相册、项目、自定义页面、单条动态、留言、打赏与友链八类内容下显示；后台可全局启用或关闭。
- 新评论默认免审核并立即公开；在后台开启审核后，新评论进入待审状态，可在「评论管理」中通过、隐藏、转回待审或删除。
- 昵称、站点链接与正文会公开，邮箱仅供服务端留存且不在页面返回；外链仅接受 HTTP(S)，提交按 IP 与评论目标限流为 10 分钟 5 次。

## 目录结构

```
prisma/                 数据模型、迁移与种子数据
src/app/(site)/         访客端页面（首页、文章、分类、标签、归档、搜索、自定义页面）
src/app/admin/          管理后台（login 与 (protected) 分组）
src/app/api/            后台 REST 接口（统一 { ok, data } / { ok, error } 结构）
src/app/uploads/        媒体文件输出路由（带缓存头）
src/components/         前台组件与后台组件（一个文件一个组件）
src/lib/                通用工具（Markdown 渲染、分页、时间格式化、接口封装等）
src/server/             auth（鉴权）、repositories（接口 + 实现）、services（接口 + 实现）、storage、validators
src/types/              共享类型定义
scripts/                备份与定时发布脚本（.sh / .ps1）
deploy/                 systemd、Nginx、PM2 与 Windows 计划任务示例
docs/                   部署文档、运维手册、上线自检清单
data/uploads/           上传的媒体文件（运行时生成，不入库）
```

## 快速开始（开发环境）

1. 准备环境：Node.js ≥ 20.9、pnpm 10、MySQL 8；
2. 创建数据库：`CREATE DATABASE firefly_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. 安装依赖并配置环境变量：

   ```bash
   pnpm install
   cp .env.example .env       # 按注释修改数据库连接、密钥与管理员初始密码
   ```

4. 初始化数据库并启动：

   ```bash
   pnpm db:generate           # 生成 Prisma 客户端（src/generated/prisma，不入库）
   pnpm db:migrate            # 开发环境执行迁移
   pnpm db:seed               # 创建管理员与站点默认设置（幂等）
   pnpm dev                   # 访问 http://localhost:3000，后台 /admin
   ```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` / `pnpm start` | 生产构建 / 启动 |
| `pnpm lint` | ESLint 检查 |
| `pnpm db:generate` | 生成 Prisma 客户端 |
| `pnpm db:migrate` / `pnpm db:deploy` | 开发迁移 / 生产迁移 |
| `pnpm db:seed` | 初始化管理员与站点设置 |
| `pnpm db:studio` | 打开 Prisma Studio 浏览数据 |

## 环境变量

变量清单与说明见 `.env.example`；生产环境务必替换 `AUTH_SECRET` 与 `CRON_SECRET`，并使用独立数据库账号（不要用 root）。`UPLOAD_DIR` 相对路径以启动目录为基准解析，生产建议写绝对路径。

## 部署与运维

- Linux（systemd / PM2 + Nginx + certbot）：`docs/deploy-linux.md`
- Windows Server（PM2 + Nginx 或 IIS ARR + 计划任务）：`docs/deploy-windows.md`
- 定时任务、备份恢复、升级回滚与排障：`docs/operations.md`
- 上线前逐项核对：`docs/go-live-checklist.md`

## 页面与接口约定

- 时间统一以 UTC 存入数据库，展示时按 `Asia/Shanghai` 格式化；
- 接口统一返回 `{ "ok": true, "data": ... }` 或 `{ "ok": false, "error": { "code": "", "message": "" } }`；
- 定时发布兜底接口 `GET/POST /api/tasks/publish-due`，需携带 `x-cron-secret` 请求头或 Bearer Token。

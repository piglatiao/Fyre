# 流萤动态博客（Firefly Dynamic）· 实施计划 V1

## 概要
- 目标：将流萤静态主题重构为前后台一体的纯动态博客（SSR + 自带后台 + 数据库），后台发布即时生效，无需重新部署。
- 已锁定决策：数据库 MySQL（开发环境 root/root，库名 `firefly_blog`）；不用 Docker（生产 Linux 与 Windows Server 均需可部署）；评论仅预留挂载位（不建评论表）；阅读数自增；定时发布一期实现；媒体存本机磁盘（留存储抽象）；认证用 Auth.js v5 beta + bcryptjs；一期单管理员、简体中文单语言。
- 技术基线（版本已核实，pnpm 管理）：Next 16.4.2（App Router，注意 Next 16 中 `middleware.ts` 已更名 `proxy.ts`）+ React 19 + TypeScript strict + Tailwind CSS 4.3.3；Prisma 7.10.0（v7 必须使用驱动适配器，MySQL 走 `@prisma/adapter-mariadb`，CLI 连接串走 `prisma.config.ts`）；next-auth 5.0.0-beta.32；bcryptjs 3.0.3；zod 4.6.7；unified + remark-gfm + rehype-sanitize + rehype-pretty-code（Shiki 4）+ rehype-slug；next-themes；lucide-react；feed（RSS）；sharp（图片处理）。
- 本机环境：Node 24.13.0 / pnpm 10.12.4 / MySQL 8.0.42（utf8mb4，3306 已在运行）。

## 关键实现与公共接口
- 工程结构（一文件一职责、接口与实现分文件）：`src/app` 下分前台 `(site)`、后台 `admin`、API 路由与 metadata 路由；`src/server` 分 repositories（接口+实现）、services（接口+实现）、validators（zod）、auth；`src/types` 共享类型、`src/lib` 通用工具；`prisma/` 放 schema/seed/migrations；`data/uploads` 存媒体。
- 数据模型（MySQL；枚举 PostStatus=DRAFT/SCHEDULED/PUBLISHED/PRIVATE，MediaType=IMAGE/FILE）：User、Post（slug 唯一、LongText 正文、摘要、封面、置顶、viewCount、seoTitle/seoDescription/seoKeywords、publishedAt/scheduledAt、索引：状态+发布时间/分类）、Category、Tag、PostTag、Page、Setting（键值 JSON）。
- 公共接口（统一 JSON：成功 `{ok:true,data}`，失败 `{ok:false,error:{code,message}}`；zod 校验；写操作一律服务端鉴权）：`/api/auth/*`；`/api/posts`、`/api/posts/[id]`；`/api/categories`、`/api/tags`（含合并）；`/api/pages`；`/api/settings`；`/api/media`（上传/列表/删除）；`/api/search`；`/api/tasks/publish-due`（cron 密钥保护）。
- 鉴权与路由保护：Auth.js v5 Credentials + JWT + HttpOnly Cookie；`src/proxy.ts`（Next 16 新约定）按 matcher 拦 `/admin/*` 重定向登录页，后台布局再做一次服务端校验；登录失败 5 次锁定 10 分钟（内存计数）。
- 定时发布：文章存 `scheduledAt`；读取入口先 `updateMany` 把到期文章转已发布（惰性生效）；服务器定时任务（Linux cron / Windows 计划任务）调用 `/api/tasks/publish-due` 兜底。可见性规则：公开=已发布或定时已到期；草稿/私密仅后台可见。
- 内容渲染与搜索：unified 渲染链服务端出 HTML 并提取目录（TOC）；搜索用 Prisma `contains`（utf8mb4 天然不区分大小写，limit 20）；后台编辑器为自研分栏 Markdown（编辑+实时预览+图片上传插入），不引重型编辑器依赖。
- 媒体：上传至 `UPLOAD_DIR`（默认 `data/uploads/年/月`），重命名防路径穿越、类型白名单（jpg/png/webp/gif/avif）≤10MB、图片转 WebP（gif 除外），经 `/uploads/[...path]` 路由带缓存头输出；存储层留接口以便后续换 OSS。
- 前台：`/`（卡片流+分页+置顶）、`/posts/[slug]`（正文、TOC、上下篇、阅读数自增、评论区预留容器）、`/category/[slug]`、`/tags`、`/tag/[slug]`、`/archives`、`/search`、`/page/[slug]`；明暗主题（next-themes）+ 响应式；UI 用设计技能产出规范，视觉参照 CuteLeaf/Firefly 气质（非像素级复刻），系统字体栈不引外链。
- 后台：登录、仪表盘、文章（筛选/编辑器/状态/定时/置顶/批量删除）、分类（非空删除需先转移）、标签（合并/删除）、页面、媒体库、站点设置（导航/社交/备案/SEO 默认值/修改密码）。
- SEO：逐页 metadata、`sitemap.ts`、`robots.ts`、`rss.xml`、文章 JSON-LD；时间存 UTC、展示 Asia/Shanghai。
- 部署（无 Docker）：`next build` + `next start`；Linux 用 systemd/PM2 + Nginx + certbot；Windows Server 用 PM2/计划任务 + Nginx/IIS 反代；交付双平台部署文档、`.env` 模板、mysqldump 备份脚本（.sh 与 .ps1）、定时任务示例；生产迁移用 `prisma migrate deploy`。

## 里程碑与协作流程
- M1 骨架：脚手架（Next+TS+Tailwind+ESLint）、依赖、Prisma 配置/schema/首个迁移/seed（管理员+站点默认设置）、登录与双重路由保护、后台空壳。
- M2 前台：主题布局、首页、文章详情、分类/标签/归档/搜索、自定义页面、SEO 文件。
- M3 后台：仪表盘、文章与编辑器、分类/标签/页面/设置/媒体、定时发布。
- M4 部署：双平台文档与脚本、HTTPS、备份恢复、上线自检清单。
- 流程约束：每个里程碑先提交文件清单与关键方案给你审核，批准后才写入；执行脚手架/安装/迁移/构建/启动命令前逐项取得你同意；失败即停、不自动执行下一步；不编译、不提交（除非你明确要求）；所有文件 UTF-8、关键处中文注释、无 AI 署名、复用优先。

## 测试与验收
- 方式：仓库当前无测试框架，一期以里程碑手工验收清单为准（如需可后续补 vitest 覆盖纯函数）。
- M1：迁移与 seed 成功；连续 5 次错误密码锁定；未登录访问 `/admin` 跳转登录。
- M2：中文/emoji/代码块/表格渲染正常且行内脚本被过滤；置顶与分页顺序正确；阅读数自增；搜索命中标题与正文；rss/robots/sitemap 输出正确。
- M3：新建→定时→到点前台可见；草稿/私密不可见；分类非空删除被拒且可转移；标签合并后关联与计数正确；非法类型/超限文件被拒；修改密码后旧会话失效。
- M4：Linux 与 Windows 各按文档完成一次部署、备份与恢复。

## 假设与默认值
- 开发库名 `firefly_blog`（本机 root/root 仅开发用；生产改用独立账号，凭据只进 `.env`）；不触碰机器上已有数据库。
- 初始管理员由 seed 从 `.env` 读取创建（首登后建议改密）。
- 单管理员、简体中文；评论只留容器与配置项；阅读数不做防刷去重。
- slug 手填优先，留空自动生成 `post-YYYYMMDD-xxxx` 并查重。
- 一期不接对象存储、不做站内统计系统、不做多语言、不做全文检索（均列二期可选）。
- 生产服务器信息与部署时机在 M4 开始前提供；双平台文档都会交付。
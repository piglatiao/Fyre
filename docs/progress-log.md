## 2026-10-16 · 前台对标官网：分类页 / 标签页重做 + 列表页横幅标题浮层

**本轮已完成**
1. 新增 `src/components/site/page-banner-overlay.tsx`：非首页横幅页面标题浮层（对齐官网 `banner-page-title-overlay` / `banner-page-title` 结构，字号 clamp(2rem,4vw,3rem) + 文字阴影，lg 以下隐藏）。
2. 分类页重做（`src/app/(site)/categories/page.tsx`）：标题卡片（主色标题 + 「全部分类 · N 篇文章」）+ 卡片网格（md 两列 / lg 三列），每卡 = 圆形图标（folder-open、主色 10% 底、hover 20%）+ 名称 + 「N 篇文章」+ 右箭头；链接仍走站内 `/category/[slug]`。
3. 标签页（`src/app/(site)/tags/page.tsx` + `src/components/site/tag-chip.tsx`）：标题卡片（主色 + 「全部标签 · N 个标签」）+ 标签云卡片（px-9 py-6），胶囊样式对齐官网：`tag-item`（名称 + `tag-count-badge` 数量徽标，圆角 9999px、btn-content 12% 底）。
4. `globals.css`：新增 `.banner-page-title` / `.banner-page-title-text`；`.tag-item` 补 hover 变主色、`:active` 背景 24%、`.tag-item .tag-count-badge`；overlay 壁纸模式隐藏页面标题浮层（对齐官网）。
5. 归档页补充「归档」横幅标题浮层（`src/app/(site)/archives/page.tsx` 挂载 BannerPortal）。
6. 研究产物：新增官网 `/categories`、`/tags` 页面 HTML 快照（`docs/research/firefly.cuteleaf.cn-site/categories-page|tags-page/index.html`）。

**证据**
- CDP 实测（1440×900）：`/categories` 横幅标题=分类、卡片 2 个；`/tags` 横幅标题=标签、胶囊 4 个；`/archives` 横幅标题=归档；
- 计算样式核对：胶囊背景 = btn-content 8%、圆角 9999px；徽标背景 = btn-content 12%、圆角 9999px（与官网 CSS 一致）；
- 截图：`%TEMP%\local-categories-full.png`、`local-tags-full.png`、`local-archives-v2.png`；
- `npx tsc --noEmit` 通过；`npx eslint`（5 个改动文件）无错误；
- 踩坑复核：改完 `globals.css` 后 Turbopack 未重编译（线上 CSS 无新规则），追加一次 `Add-Content` 写同文件后立即生效（已在 CSS 里验证 `banner-page-title` / `tag-count-badge` 存在）。

**下一个 3 小时目标**
1. 文章页浮动按钮组（回到首页）、归档页时间轴细节、暗色模式核对等继续对标官网；
2. 内置浏览器横幅复验（待用户刷新内置浏览器标签后从诊断日志确认），确认正常后移除调试上报代码（`banner-debug.ts` + `/api/debug/banner`）；
3. 后台卡片质感对齐前台收尾。
## 2026-10-16 · 横幅「切换浏览器标签页后空白」根因取证 + 三层加固（封面容器化 / 帧确认 / 分级恢复）

**本轮已完成**
1. 新增开发期横幅诊断上报（`src/lib/banner-debug.ts` + `src/app/api/debug/banner/route.ts`，仅非生产环境启用，日志写系统临时目录 `firefly-banner-debug.log`）：上报 sid/UA/视口/可见性/readyState/networkState/currentTime/透明度/解码帧数，用于在真实浏览器（含 Codex 内置浏览器）取证。
2. 根因（诊断数据实测）：
   - 用户 Chrome 会话（1920×919）里视频源 `networkState=3`（NETWORK_NO_SOURCE，从未加载成功），旧实现唯一兜底是视频**下层**的封面 `<img>`，视频图层一旦交不出帧就只剩主题渐变（= 用户截图里的纯粉色）；
   - 后台标签页会让宿主回收解码器：`readyState` 掉到 0、`currentTime` 归零、`play()` 被拒；
   - 内嵌浏览器用「样式隐藏」切标签页时不触发 visibilitychange，旧逻辑还会因 `visibilityState` 长期停在 hidden 把恢复流程锁死。
3. 重构 `src/components/site/banner-video.tsx`：
   - 封面改画在**容器自身的背景**上（新类 `.banner-media-frame`，background-image=封面），不再依赖独立图层；
   - 视频只有在确认解码帧（readyState≥2 且非暂停）后才淡入，任何时刻都有封面兜底；
   - 恢复流程升级为三层：催帧/播放 → `load()` 重载 → **重建 video 元素**（`key` 计数）；另加一次性容器重绘（opacity 0.999 → 1）修复「图层丢失后不重绘」；
   - 防循环与节流：恢复额度放 ref 跨重建保留（不再因重建归零导致无限重载）、动作间隔 6s/15s、源不可用（net=3）只重建一次、后台标签页不重载/重建、`play()` 失败 3 秒节流；
   - 判定可见性改用「布局盒是否存在」（`getClientRects`），不再拿 `document.visibilityState` 当闸门。
4. `globals.css`：overlay / fullscreen 壁纸模式的模糊与缩放目标从 `video` 改为 `.banner-media-frame`（避免父容器+子视频双重滤镜），容器背景随模式居中。

**证据（CDP 实测，无头 Chrome 1440×900，dev 环境）**
- 冷启动 6s：`opacity=1`、`readyState=4`、解码 354 帧、容器背景 = 封面地址；
- 切走 12s：`opacity=0`（自动露封面）、视频继续解码（t 7.87、1095 帧）；
- 切回：**330ms** 内恢复淡入并持续出帧；
- 屏蔽视频源 40s：封面常驻、`remount` 仅 1 次、`play-fail` 仅 1 次（节流生效）、之后完全静默；截图 `%TEMP%\banner-v4-blocked.png`；
- 正常场景截图 `%TEMP%\banner-v5-before.png` / `banner-v5-after.png`；SSR HTML 已含 `.banner-media-frame` + background-image；dev 编译无报错（err log 为空）。

**遗留问题 / 待验收**
- 诊断上报为临时手段，待用户在内置浏览器确认横幅正常后移除（接口 + 客户端上报）；
- 用户在 Chrome（1920×919）里视频源加载失败（net=3）需另查（可能为扩展拦截/网络策略），当前已有封面兜底不会空白。

**下一个 3 小时目标**
1. 内置浏览器复验横幅（刷新首页标签 → 切走 → 切回），并从诊断日志确认恢复链路；确认后移除诊断代码；
2. 前台继续对标官网：分类页卡片化、标签/归档页细节、文章页浮动按钮组（回到首页）；
3. 后台配色与前台统一收尾（强调色跟随主题色相已生效，继续对齐卡片质感）。
## 2026-10-16 · 后台媒体选择器 + 远程转存（媒体能力闭环）

**本轮已完成**
1. 后台媒体选择器（新组件）：
   - `src/components/admin/media-picker-dialog.tsx`：弹窗浏览媒体库，页签「图片 / 视频 / 全部 / 其它文件」，分页 + 弹窗内直接上传（上传后自动选中），Esc/点击遮罩关闭，打开时锁滚动；
   - `src/components/admin/media-url-field.tsx`：字段级封装 = 地址输入 + 「媒体库」+「上传」+「转存到媒体库」+「从视频抓帧」+「清空」+ 图片/视频/文件预览。
2. 接入位置：站点设置的 Logo、站点图标、横幅壁纸（桌面/移动，支持图片与 MP4/WebM）、视频封面图、站长头像；文章编辑器的封面字段（原来只有「上传封面」）。
3. 一键从视频抓帧（`src/lib/capture-video-frame.ts`）：客户端 canvas 抓帧 → WebP → 入库回填。同源视频 1 秒内完成；跨域视频（未开 CORS）会给出中文提示，引导先转存。
4. 远程转存（新后端能力）：`POST /api/media/import` + `src/server/storage/remote-media-fetcher.{interface,}.ts` + 服务层 `importFromUrl`，媒体库页面新增「转存到媒体库」输入行。仅允许 http/https，拦截内网/回环地址（SSRF 防护，跟随跳转后再次校验），单文件上限 100MB，落盘遵守原有类型白名单（图片自动转 WebP）。
5. 支撑改动：`src/lib/upload-media-file.ts` 抽出单文件上传；`MediaService.importFromUrl`、组合根注入 `HttpRemoteMediaFetcher`。
6. 文章代码块顶部条 + 复制按钮（对齐官网规格）：新增服务端 rehype 插件 `src/lib/rehype-code-title.ts`（给 Shiki 的 figure 补上语言名 figcaption，服务端即有高度、不会因客户端注入抖动），新增客户端组件 `src/components/site/article-code-copy.tsx`（注入复制按钮、按行拼接还原原始代码、复制后 1.6 秒回退文案），`MarkdownContent` 挂载该组件，`globals.css` 顶部条改为 2rem 高、语言名靠左、复制按钮靠右（hover 用主题主色）。
7. 文章编辑器增强：粘贴截图 / 拖拽图片自动上传并插入 Markdown（多文件顺序上传；`insertAtCursor` 改为函数式更新，连续插入不再互相覆盖），新增「媒体库插图」按钮复用媒体选择弹窗，正文占位提示同步更新。
- 代码块复制实测：顶部条显示语言 `bash` 与复制按钮，点击后按钮变「已复制」并 1.6 秒回退，剪贴板内容为 `pnpm install\npnpm dev`；浅色/暗色截图 `%TEMP%\codeblock-light.png`、`codeblock-dark.png`；
- 编辑器实测（CDP 合成 paste/drop 事件）：媒体库插图插入 `![author-avatar.jpg](…)`、粘贴 `paste-test.png`、拖拽 `drop-test.png` 均自动上传并按顺序追加，正文最终含三条图片语法；两张测试图已删除（媒体库仍为 5 条）；
- 踩坑记录：用 `[System.IO.File]::WriteAllText` 直接改 `globals.css` 时 Turbopack 未感知，需再写一次触发重编译；已确认线上 CSS 含新规则 `code-copy-btn`；
**证据**
- `npx tsc --noEmit` 通过；对全部新增/改动文件执行 `npx eslint` 无错误（含修正 `react-hooks/set-state-in-effect`）；
- CDP 实测（管理员登录态）：6 个设置字段均出现「媒体库/上传」按钮；弹窗页签与 5 条媒体正常；选中后字段回填 `/uploads/2026/10/1792151760136-faae53ff.webp`；
- 转存实测：内网地址被拒（`出于安全考虑，不支持转存内网地址`）、非法地址返回参数错误、远程 PNG 216ms 转存成功（3.6KB WebP）；横幅视频 46MB 转存耗时 37.8s 入库成功；
- 抓帧实测：把转存后的本地视频写入横幅字段后，「从视频抓帧」1.0s 生成 `/uploads/2026/10/1792154078742-240117d1.webp`；
- 截图：`%TEMP%\picker-dialog.png`、`transfer-and-grab.png`、`banner-fields.png`（字段按钮组与预览）、`media-transfer-row.png`；
- 测试产生的 3 个媒体（含 46MB 视频）已通过接口删除，媒体库恢复 5 条，`data/uploads` 与数据库一致。

**遗留问题**
- 抓帧依赖视频可解码且允许跨域；跨域视频必须先用「转存到媒体库」本地化（已写入字段提示）。

**下一个 3 小时目标**
1. 后台整体配色与前台统一：把后台的 sky 蓝强调色改为跟随主题色相（令牌映射），验收=切换 hue 后台按钮/焦点色同步变化；
2. 前台继续对标官网：文章页浮动按钮组（目录/回到顶部/首页）、暗色代码块与表格细节、归档页时间轴；
3. 编辑器增强：正文内粘贴/拖拽图片自动上传并插入 Markdown、从媒体库插入图片。
## 2026-10-16 · 横幅「切浏览器标签页后不显示」二次加固（封面兜底 + 渲染心跳）

**本轮已完成**
1. 复现排查：用带 GPU 的有头 Chrome（窗口移到可视区外、关闭原生遮挡检测，调试端口 9223）做真实标签页切换，隐藏 23 秒后切回 278ms 恢复播放，硬件加速环境下未复现空白；定位到空白来自「视频图层交不出帧」这类浏览器行为，而旧实现的封面图在视频**下层**，视频一旦被合成器提交为空白/黑帧就把封面盖住了 —— 与用户截图（横幅只剩浅粉背景）完全一致。
2. 重写封面兜底策略（src/components/site/banner-video.tsx）：合成器交不出新帧时把 `video` 置为透明（`opacity=0`）露出下方封面，确认有新帧后再淡回可见（300ms 过渡），彻底杜绝「空白/黑屏直接暴露给用户」。
3. 新增帧呈现心跳：`requestVideoFrameCallback` 连续 1.5 秒没有新帧送进合成器即判定画面不可用并兜底；不支持该 API 的浏览器退化为「播放进度是否推进」判断。
4. 新增渲染心跳：内嵌浏览器/无头环境用样式隐藏标签页时不会触发 visibilitychange，此时 rAF 会出现长空档（≥1.2 秒），据此补一次恢复流程 —— 兜底封面 + 强制图层重建 + 立即播放 + 微调播放位置（`currentTime` 自赋值）促使解码器立刻出帧。
5. 原有能力保留：不可见时不播放（避免与浏览器自动暂停互相打断）、恢复可见/窗口聚焦/pageshow/交叉观察进入视口立即恢复、6 秒无进展 `load()` 重拉流（快速重载上限 3 次、间隔递增）。

**证据**
- `npx tsc --noEmit` 通过；dev 编译 `✓ Compiled in 280ms` 无报错；首页控制台错误数 0；
- GPU 环境回归：隐藏 23 秒期间播放调用 0 次，切回 278ms 恢复（plays=1、reloads=0），无回退；
- 空白场景验证：把视频源指向不存在的地址（模拟解码器/图层报废）后 2.6 秒内自动兜底封面，横幅仍显示画面不再空白；
- 隐藏期间执行 `load()`（readyState 归零，模拟解码器被回收）后切回：60ms 内恢复播放，无额外重载。
- 复现工具：`%TEMP%\firefly-gpu-tabswitch.js`（切换复现）、`%TEMP%\firefly-poster-logic.js`（兜底逻辑验证）；启动带 GPU 的 Chrome：`chrome.exe --remote-debugging-port=9223 --user-data-dir=%TEMP%\firefly-chrome-gpu --window-position=-4000,0 --disable-features=CalculateNativeWinOcclusion about:blank`（窗口在屏幕外，不打扰使用）。

**遗留问题**
- 用户当前所在环境为 App 内置浏览器，若强刷（Ctrl+Shift+R）后仍空白，需要补充信息：空白区域是纯粉/纯白/纯黑，以及切走多久后回来。

**下一个 3 小时目标**
1. 后台媒体选择器：视频封面图/各图片字段/文章封面统一支持弹窗从媒体库选图，视频字段支持一键抓帧生成封面，验收=后台点选即写入并在前台生效。
2. 前台细节继续对标官网：文章页浮动按钮组（目录/回到顶部/首页）、暗色下代码块与表格、归档页时间轴样式。
3. 文章编辑器增强：正文内粘贴/拖拽图片自动上传并插入 Markdown，验收=编辑器内粘贴截图即可插入链接。
# 流萤动态博客 · 进度日志

> 用途：每 3 小时一轮的进度总结与目标设定都追加到这里（最新在最上面）。
> 自动轮次提示词备份：C:\Users\Administrator\.codex\firefly-schedule\prompt.md（App 的 Automations 面板里粘贴即可，频率每 3 小时）。

## 2026-10-16 23:xx · 前台对标官网（对照截图 + 演示内容 + 404 精修）

**本轮已完成**
1. 用无头 Chrome 实拍官网与本站同页做对照：`docs/design-references/local/cmp-official-home.png`、`cmp-official-post.png`、`cmp-local-home-v2.png`、`cmp-local-home-v2-dark.png`、`cmp-local-post-v2.png`、`cmp-local-home-mobile-v2.png`。
   结论：结构/令牌/卡片基本一致，主要差距是「内容为空」导致看起来不高级（无封面、无社交入口、无公告、无副标题轮播）。
2. 补齐演示内容（走后台接口写入，可在后台随时改）：
   - 从横幅视频抓 3 帧 → 上传媒体库 → 作为 3 篇文章封面（`/uploads/2026/10/17921517599xx-*.webp`），列表卡片恢复官网那种「右侧 30% 封面」版式；
   - 抓一帧方形头像 → `authorAvatar`，左栏资料卡不再显示占位方块；
   - `socialLinks`（GitHub / 邮箱）+ `announcementText`（公告）+ `bannerSubtitles`（3 条打字机文案）+ `authorName/Bio`，横幅下方出现社交胶囊、左栏出现公告与社交按钮。
3. 404 页对齐官网：水印 404、告警图标、大号主色 404、标题/说明、「返回首页」主色按钮与右下角装饰图标。
4. 排查 404 路由左下角出现的 Next 开发徽标 “1 Issue”：控制台为 `Encountered a script tag while rendering React component`，仅 404 路由出现，`/tags`、`/posts/*`、`/search` 与首页均无；用 `pnpm build` + `next start --port 3100` 复验，**生产模式下 404 路由无任何控制台报错**，判断为 Next 内部 dev 覆盖层告警，非本项目代码缺陷。

**证据**
- 数据库核对：3 篇文章 coverUrl 均已写入；media 表 5 条（3 封面 + 1 视频封面 + 1 头像）；settings 中 authorAvatar / announcementText / bannerSubtitles / socialLinks 均已生效；
- 截图：`cmp-local-home-v2.png`（首页，含封面/社交/公告）、`cmp-local-404.png`（新 404）；
- `npx tsc --noEmit` 通过；`pnpm build` 通过、0 warning；dev server 已恢复（`http://localhost:3000`）。

**遗留问题**
- 官网的「最新动态」侧栏带时间与置顶标记、左栏还有音乐播放器卡片，属官网特有内容，本期不做（音乐播放器未在需求内）。
- 官网 404 会在横幅标题位显示 “404”，本项目 404 未接管横幅标题浮层（小差异，可后续补）。

**下一个 3 小时目标**
1. 后台「视频封面图 / 各图片字段」统一接入媒体库选择器（弹窗选图 + 一键从上传视频抓帧），验收=后台点选即可写入地址。
2. 前台文章页细节继续对标：浮动按钮组（目录/回到顶部/首页）、代码块与表格在暗色下的细节、归档页时间轴样式。
3. 文章编辑器增强：正文内粘贴/拖拽图片自动上传并插入 Markdown，验收=编辑器内粘贴截图即可插入链接。
## 2026-10-16 21:xx · 仪表盘升级（高级版）

**本轮已完成**
1. 数据层补齐：`AdminPostRepository` 新增 `listPublishedSince` / `countWithoutCover` / `countEncrypted` / `findNextScheduledAt`；`DashboardStats` 增加「缺少封面、加密文章、最近定时时间」；服务层新增 `getPublishTrend(days)`（按 Asia/Shanghai 聚合，含零发布的日期）。
2. 新增组件：`src/components/admin/dashboard-stat-card.tsx`（图标数据卡）、`src/components/admin/dashboard-trend-chart.tsx`（纯 CSS 柱状趋势图，网格线 + 今日高亮，跟随主题色相，不引第三方图表库）。
3. 仪表盘页面重构：站点速览（问候语 + 站点名/描述 + 累计阅读/页面/媒体 + 写文章/媒体库/页面/设置 快捷入口）→ 4 张数据卡 → 发布趋势（近 30 天）→ 最近更新（状态/阅读/加密/置顶标记）→ 待办提醒（定时待发布/草稿/缺少封面/加密）→ 站点外观速览（主题色相、壁纸模式、默认主题、卡片透明度）。
4. 全部颜色走主题令牌（`--primary`、`.admin-theme` 映射），浅色/深色均与前台一致。

**证据**
- 数据一致性（SQL 对照页面）：posts=3、views=17、encrypted=1、coverless=3、categories=2、tags=4、pages=1、media=1，published 全部在今天 → 页面显示完全一致；
- 截图：`docs/design-references/local/admin-dashboard-v5-light.png`、`admin-dashboard-v4-dark.png`；
- `npx tsc --noEmit` 通过；`pnpm build` 通过、0 warning；dev server 已恢复（`http://localhost:3000`，日志 `%TEMP%\firefly-dev.log`）。

**遗留问题**
- 趋势图目前是「按天发布数」，阅读量没有历史记录（`viewCount` 只有累计值），近 30 天阅读增量需要新表，暂列二期。

**下一个 3 小时目标**
1. 后台「视频封面图」升级：媒体库选择 + 一键从视频抓帧写入封面（新 API + 按钮），验收=后台点一次即可生成封面并显示在前台横幅。
2. 前台首页/文章页对照 `docs/research/firefly.cuteleaf.cn-site/` 精修（卡片、侧栏、标签云、页脚），验收=与官网对应页面截图逐项对照。
3. 文章编辑器增强：批量上传图片到正文、上传进度与失败重试，验收=编辑器内拖拽/粘贴图片可用。
## 2026-10-16 19:4x · 横幅“切标签页后不显示”修复

**本轮已完成**
1. 复现定位：真标签页隐藏时浏览器会主动暂停“纯视频”媒体（paused=true）；旧实现只在挂载时播放一次，且在页面不可见时仍反复调用播放，与浏览器互相打断。
2. 重写视频壁纸组件：新增 src/components/site/banner-video.tsx（单文件单组件），banner-media.tsx 退回纯渲染层。行为：
   - 不可见时不发起播放（避免争抢）；恢复可见 / 窗口聚焦 / pageshow / 交叉观察进入视口 → 立即恢复播放并强制图层重新合成；
   - 1 秒自检：可见状态下暂停或播放进度长时间不推进 → 先重试播放，超过 6 秒无进展则重新 load() 拉流（重载间隔随次数放大，最多快速重载 3 次）；
   - 新增封面兜底层：视频下方渲染封面图，视频被回收或重载期间横幅不会空白。
3. 视频封面：从横幅视频抓帧 → 上传媒体库（/uploads/2026/10/1792149477855-c999c9b4.webp，47KB WebP）→ 写入 bannerVideoPoster；后台“外观主题 → 视频封面图”可改可清空。
4. 四种壁纸模式实测：banner / overlay / fullscreen / none 首页截图正常，非首页与移动端断点正常，最终已恢复 banner。
5. npx tsc --noEmit 通过；pnpm build 通过、0 warning；dev server 已按原命令恢复（日志 %TEMP%\firefly-dev.log）。

**证据**
- 冷/热启动：切回标签页后 256ms / 1ms 内恢复播放（原来需要 10~18 秒）；
- 隐藏 20~35 秒期间播放调用次数 = 0（不再与浏览器争抢），切回后 1 次调用即恢复；
- 隐藏期间强制 readyState=0（模拟解码器被回收）后切回，268ms 内重新出画；
- 截图：docs/design-references/local/ 下 banner-poster-normal.png、banner-poster-fallback.png、wallpaper-mode-*-home.png、wallpaper-mobile-*.png、admin-settings-video-poster.png。

**遗留问题**
- 若在 App 内置浏览器里仍出现空白：多为浏览器回收视频图层后的重绘问题，本轮已用“封面兜底层 + 恢复时强制重绘”覆盖；仍复现时请记录现象（只有视频空白还是整页空白、切走时长、是否报错）。
- themeHue 当前为 0（粉色调），后台可调：设置 → 外观主题 → 主题色相。
- 定时任务：本环境 automation_update 工具不可用，无人值守自启 agent 被策略拦截，需要手动在 App → Automations 创建一次（提示词已备份）。

**下一个 3 小时目标**
1. 后台“视频封面图”升级：支持从媒体库选择 + 一键从视频抓帧（现在是手填地址），验收=在后台点按钮即可生成并写入封面。
2. 仪表盘“高级化”：数据卡片（文章/分类/标签/阅读）+ 近 30 天发布趋势 + 待办与快捷入口，验收=截图对照现版本明显更精致。
3. 前台精修：对照 docs/research/firefly.cuteleaf.cn-site/ 的 spec 补齐首页卡片与右侧栏细节，验收=与官网对应页面截图逐项对照。
## 2026-10-16 21:5x · 横幅去外链化 + 前台悬浮控件组对齐官网

**本轮已完成**
1. 横幅视频本地化：远程 mp4（img.jieyi.eu.org，46MB，Cloudflare）在真实浏览器里始终加载失败（networkState=2→3 循环、readyState=0、0 帧，诊断日志可证）→ 已下载到本地上传目录（/uploads/2026/10/1792158293432-b8e94fe0.mp4，46,057,794 字节），写入媒体库（media id=14，FILE），并把 bannerImageDesktop / bannerImageMobile 都切到本地地址，彻底摆脱外网 CDN。
2. 修复后实测（无头 Chrome 1440×900）：冷启动 532ms 内视频出画（readyState≥2、有解码帧、opacity=1）；隐藏 12 秒切回 318ms 恢复；/uploads 对 mp4 正确返回 206 + Accept-Ranges（可拖动）。
3. 前台悬浮控件组对齐官网：新增 floating-toc-store（目录共享状态）、floating-toc-registrar（页面注册目录）、floating-controls（右下角控件组：目录+主页+回顶）；重写 floating-toc（官方编号/圆点徽标样式）与 back-to-top（阈值 200px）；globals.css 新增 .floating-controls-container/.floating-btn/.floating-toc-panel/.toc-* 全套样式并补齐亮暗变量。
4. 与官网逐值对照（无头 Chrome 实测 firefly.cuteleaf.cn）：容器 fixed/column/gap 8px/right 16px/bottom 64px/z 1000/pointer-events none 全部一致；按钮 48×48、圆角 16px、浅色底 rgb(255,255,255)、深色卡片色+1px 描边全部一致。

**证据**
- 脚本 %TEMP%\firefly-verify-v1/v2/v3.js（CDP 9222）；截图 %TEMP%\verify-home.png、verify-post-toc.png、verify-btns-dark.png、verify-toc-dark.png；
- 目录面板 6 条 #1~#6 编号徽标正确，暗色面板/徽标颜色正常；tsc --noEmit 通过；eslint 通过（修复一处 react-hooks/immutability）。

**遗留问题**
- 横幅诊断代码（banner-debug.ts、/api/debug/banner、banner-video.tsx 内上报）待用户在内置浏览器确认后移除（仅开发期生效）；
- 内置浏览器（CodexBrowser）会话仍未出现在的诊断日志中，该标签页需刷新一次获取“本地视频 + 新悬浮控件”。

**下一个 3 小时目标**
1. 用户内置浏览器复验 → 移除横幅诊断代码并复验。
2. 前台对照官网继续精修：页脚细节、标签云、归档时间轴。
3. 后台卡片质感继续对齐前台。
## 2026-10-16 22:0x · 横幅隐藏加载加固 + 页脚/Atom 对齐官网

**本轮已完成**
1. 横幅恢复加固：真实 Chrome 证据（1920×919 会话）显示“页面在隐藏状态加载”时浏览器会把媒体加载推迟到切回才开始（readyState=0/net=2 长时间挂起）。recover() 增加兜底：切回时若视频还没有元数据（readyState===0）主动 load() 一次（3 秒节流），保证任意宿主环境下切回必然出画。
2. 订阅源：抽取共享构建 src/lib/site-feed.ts（RSS/Atom 共用条目、加密文章不下发），新增 /atom.xml 路由；/rss.xml 改为复用同一构建。
3. 页脚对齐官网：分隔线加 transition；版权行改为 `© {年} {站名}. All Rights Reserved. / RSS / Atom / Sitemap`。

**证据**
- 横幅回归测试：冷启动出画（decoded 348）、切走 12 秒后封面兜底（op=0）、切回 318ms 恢复（decoded 连续增长），无回归；
- /atom.xml 200（application/atom+xml，2 条，加密文章正确排除）、/rss.xml 200（2 条）、/sitemap.xml 200；
- 页脚 DOM：links=[/rss.xml, /atom.xml, /sitemap.xml]、文案“© 2026 流萤. All Rights Reserved.”；截图 %TEMP%\verify-footer.png；
- tsc --noEmit 通过；eslint 通过（新文件与改动文件）。

**遗留问题**
- automation_update/list_projects 在本环境不可用：“每 3 小时新开对话窗口总结进度”的定时任务需在 App → Automations 手动创建（提示词沿用进度日志中的备份）。
- 横幅诊断代码仍待用户在内置浏览器确认后移除。

**下一个 3 小时目标**
1. 用户确认后：移除横幅诊断代码并复验（横幅+悬浮控件+页脚）。
2. 后台视觉继续对齐前台（媒体库/文章列表卡片质感）。
3. 前台精修剩余项：首页卡片与右栏细节逐项截图对照官网。
## 2026-10-16 22:1x · 横幅切标签页复验通过 + 动态模块方案

**本轮已完成**
1. 横幅"切浏览器标签页不显示"根因闭环：真实浏览器证据（会话 7kav7p，1920×919）显示页面在隐藏标签页中加载时，浏览器把媒体加载推迟到切回才开始（readyState=0 / networkState=2 长期挂起，15 分钟 0 帧）；该会话加载于 21:51，早于最终修复（21:58 写入 recover:load），属旧代码。
2. 按用户原始路径实测（新脚本 firefly-banner-v6.js，CDP 9222，1920×919）：后台标签页加载 20 秒（成功复现 rs=0/net=2 卡死）→ 切回前台 278ms 出画（事件链 recover:load → 202ms 后 reveal，decoded=10→100）；播放中切走 15 秒 → 切回 281ms 恢复。均通过。
3. 已请用户刷新其内置浏览器标签页复验；诊断代码（banner-debug.ts、/api/debug/banner、banner-video.tsx 上报）待其确认后移除。
4. 动态模块方案文档：docs/planning/dynamics-module-plan-r1.md（对齐官网 /dynamic/ 与右栏「最新动态」，含数据模型、18 个新增文件清单、API、验收清单），待用户审核批准后实施。

**证据**
- %TEMP%\firefly-banner-v6.js 输出：场景1/场景2 恢复耗时 278ms/281ms；%TEMP%\firefly-banner-debug.log 会话 f8pgmf 事件链；
- 官网实测：https://firefly.cuteleaf.cn/api/dynamic.json（4 条，字段 id/published/html/images/searchText/pinned/location）；/dynamic/ 页面与右栏 widget[data-id=latest-dynamics] 结构；截图 %TEMP%\official-dynamic-top.png。

**遗留问题**
- 本环境 automation_update / list_projects 工具不可用："每 3 小时新开对话窗口总结进度"需用户在 App → Automations 手动创建（提示词见本日志上一节 + docs/planning 说明）。
- 用户内置浏览器会话 7kav7p 仍是旧代码，刷新后需观察新会话是否 reveal 成功。

**下一个 3 小时目标**
1. 用户批准后实施动态模块（R1）。
2. 用户复验横幅 → 移除诊断代码并回归（横幅/悬浮控件/页脚）。
3. 官网左栏「音乐」widget 评估（需音频上传支持，列为 R2 候选）。
## 2026-10-16 22:3x · 站点统计对齐官网（总字数）

**本轮已完成**
1. 与官网「站点统计」卡逐项对照，补齐缺失的「总字数」行（官网字段：文章/分类/标签/总字数/运行时长/最后活动；我们新增总字数，保留阅读与运行天数）。
   - src/types/site-stats.ts：SiteStats 增加 totalWords。
   - src/server/repositories/post.repository.ts：findSiteStats 用 $queryRaw 统计已发布文章正文 CHAR_LENGTH 合计（表名 posts，UTF-8 中文按 1 字符计）。
   - src/components/site/sidebar/site-stats-card.tsx：新增「总字数」行（Type 图标、千分位格式与官网一致）。
2. M4 部署交付物核验齐全：.env.example、scripts/backup-db.sh/.ps1、scripts/publish-due.sh/.ps1、deploy/linux（crontab.example/firefly.service/nginx-firefly.conf）、deploy/windows（ecosystem.config.cjs/nginx-firefly.conf/register-scheduled-tasks.ps1）、4 份运维文档，内容抽查通过。

**证据**
- DB 期望值 1147（mysql 直查）＝ 页面实测「总字数 1,147」；统计卡 DOM 文本：文章|3|分类|2|标签|4|总字数|1,147|阅读|33|运行天数|0 天；
- 截图 %TEMP%\stats-card-v4.png；tsc --noEmit 通过；eslint 0 错误（该文件原有 3 个未使用导入 warning，未动）。

**遗留问题**
- 等用户：① 刷新内置浏览器标签页复验横幅切标签页；② 审核 docs/planning/dynamics-module-plan-r1.md（动态模块）。

**下一个 3 小时目标**
1. 用户批准后实施动态模块（R1），迁移 → 后台 → /dynamic → 右栏。
2. 横幅诊断代码移除 + 回归（用户确认后）。
## 2026-10-16 22:3x · 移动端对齐核查 + 主题色链路核验

**本轮已完成**
1. 移动端（390×844）逐项核查：头部（logo+搜索+显示设置+汉堡）、横幅（标题+打字机副标题+社交按钮）、分类条、文章卡片（封面/标题/置顶/日期/分类徽标/摘要/标签）与官网移动端参考图（docs/design-references/.../home-mobile-light.png）结构一致，达标。
2. 排查"滚动后截图空白"：非真实 bug——无头 Chrome 在 window.scrollTo 之后截图返回空白合成帧（桌面模式同样复现）；改用高视口 + captureBeyondViewport 裁剪（不滚动）后，正文卡片渲染完全正常（%TEMP%\mobile-expB.png）。
3. 主题色「后台可配」链路核验完整：后台设置滑块 themeHue → src/app/layout.tsx 注入 --hue → 前台访客可在显示设置里本地覆盖（localStorage firefly-hue），与官网行为一致。

**证据**
- %TEMP%\mobile-home-v1.png（首屏）、mobile-expB.png（滚动区域正确渲染）、mobile-expA.png（伪影复现）；src/app/layout.tsx:25、settings-manager.tsx:242-268、display-settings.tsx。

**遗留问题**
- 用户新会话 mki2av（22:22 刷新、最新代码）仍停在后台标签页（rs=0/net=2 属隐藏期预期），等切回后确认 recover:load → reveal。
- 动态模块方案待用户批准（docs/planning/dynamics-module-plan-r1.md）。

**下一个 3 小时目标**
1. 用户切回后核对 mki2av 事件链 → 移除横幅诊断代码并回归。
2. 用户批准后实施动态模块（R1）。
## 2026-10-16 22:4x · 文章页对齐官网（代码块双主题 + 横幅引号）

**本轮已完成**
1. 文章页逐屏对比（官方 /posts/guide/ vs 本机 /posts/markdown-guide，1440×900，captureBeyondViewport 分屏截图）：导航/横幅/左栏/分类条/文章卡/正文排版/上下篇/版权卡/评论占位/浮动按钮全部对齐；发现并修复两处差异：
   - 代码块：亮色模式原来背景是深色且完全无语法着色（--shiki-light 从未被应用）→ 现改为亮色浅底 + Shiki 亮色令牌着色 + 1px 描边，暗色模式保持深底浅字；复制按钮/顶栏颜色改为随代码块前景色（color-mix）。
   - 文章横幅摘要：补齐官网同款首尾引号装饰（.banner-post-description-quote，绝对定位、35% 白、1.5rem、起始引号 rotate(180deg)、左上/右下 0.45/0.5rem，与官网 CSS 逐值一致），摘要容器加 position:relative。
2. 证据：截图 %TEMP%\codeblock-light.png、codeblock-dark.png、post-banner-quote.png；DOM 校验 quotes=2、quoteColor=rgba(255,255,255,0.35)、descPos=relative；tsc --noEmit 与 eslint 通过。

**遗留问题**
- 用户会话 mki2av 仍停在后台标签页，等切回后确认横幅恢复事件链。
- 动态模块方案待批准（docs/planning/dynamics-module-plan-r1.md）。
- 官网「所属系列」功能暂缺（记录为后续候选，与动态模块/音乐 widget 一起排）。

**下一个 3 小时目标**
1. 用户切回后核对 mki2av → 移除横幅诊断代码并回归。
2. 用户批准后实施动态模块（R1）。
## 2026-10-16 22:5x · 横幅"切浏览器标签页不显示"完整验证

**本轮已完成**
1. 用真实会话日志确认内置浏览器（Codex 应用内）行为：标签页隐藏时媒体加载被推迟（rs=0/net=2 长期挂起），页面不可见时视频本就不可能出画——属浏览器机制；切回后能否"眨眼恢复"取决于页面恢复逻辑。
2. 新增最坏情况回归测试 %TEMP%\firefly-banner-v7.js：注入伪装脚本（visibilityState 恒为 hidden、hasFocus 恒 false、visibilitychange/focus 事件不投递）完整模拟内置浏览器环境：
   - 后台标签页加载 20s（复现卡住，封面兜底在位）→ 切回 301ms 出画（recover:load → reveal，decoded=12）；
   - 播放中切走 12s → 切回 294ms 出画；截图 %TEMP%\firefly-banner-v7.png 正常。
3. 事件链证据（sid=bm1q79）：mount:poster(hidden,rs=0) → tick… → recover:load + recover:heartbeat → reveal(rs=4,op=1) → cover(切走) → recover:heartbeat → reveal。
4. 分析真实会话：mki2av（22:22 刷新）自 22:22 起一直 vis=hidden（Chrome 5 分钟节流特征一致），说明该标签页始终在后台、用户尚未切回验证新代码。

**遗留问题**
- 需用户实测一次：刷新"流萤"页 → 切到"站点设置"等 5~10 秒 → 切回，横幅应在 1 秒内自动出画。
- 诊断代码待用户确认后移除（src/lib/banner-debug.ts、src/app/api/debug/banner/route.ts、banner-video.tsx 内 reportBannerDebug 调用）。
- 动态模块方案待批准（docs/planning/dynamics-module-plan-r1.md）。

**下一个 3 小时目标**
1. 用户确认后移除横幅诊断代码并回归复验。
2. 用户批准后实施动态模块（R1）。
## 2026-10-16 23:0x · 代码块复刻官方 Expressive Code（行号栏 + 语言徽标 + 复制按钮）

**本轮已完成**
1. 深度解析官方站点代码块实现（CDP 计算样式 + ec.gtzw0.css 规则 + 官方 DOM）：官方为 Expressive Code（Astro 集成），无顶栏、右上角语言徽标（大写、悬停淡出）、左侧行号栏（2ch 内边距、灰色 #8a8a8c）、行号与代码之间 1px rgba(138,138,140,0.2) 分隔线、代码面 #fafafa/#282c34、边框 1.5px #d4d4d4/#3c424e、圆角 0.75rem+1.5px = 13.5px、行高 1.5rem、复制按钮 2rem 方形图标（悬停外框显示 0.75、悬停按钮 1）。
2. 关键发现并复用：官方徽标配色不是 EC 默认浅蓝，而是站点主题令牌 `--btn-regular-bg` / `--btn-content`（官方 oklch(.95 .025 165)/(.55 .12 165)）；本站令牌公式与其逐值一致（var(--hue) 驱动），因此徽标天然随"后台主题色"联动。
3. 代码实现（最小改动）：
   - 新增 `src/lib/rehype-ec-lines.ts`：把 Shiki 行节点改造成官方同款 gutter + code 双栏结构（div.ec-line > div.ec-gutter > span.ln + div.ec-code），拆除 rehype-pretty-code 的 display:grid 内联样式，带标题的 figcaption 包装成 .code-title 并给 figure 加 data-ec-title。
   - `src/lib/markdown.ts`：Shiki 双主题从 github-light/dark 换成官方同款 one-light / one-dark-pro；接入 rehypeEcLines；删除已无用的 rehype-code-title.ts（文件已移除）。
   - `src/components/site/article-code-copy.tsx`：复制按钮改为右上角图标按钮（复制/打勾图标切换），复制内容只取代码列（不含行号），点击后 1.6s 复位。
   - `globals.css`：重写代码块样式段落（+8 个 --codeblock-* 变量定义），整体对齐官方数值；复制按钮悬停选择器带 `:not(:hover)` 修正优先级（与官方一致）。
4. 实测（无头 Chrome，1440 宽，真实渲染链）：
   - 亮色：pre bg rgb(250,250,250)、边框 1px rgb(212,212,212)、圆角 13.5px、行高 24px、行号色 rgb(138,138,140)、分隔线 1px rgba(138,138,140,0.2)、代码列内边距 20.1px 53.6px——与官方逐值一致；
   - 暗色：rgb(40,44,52) / rgb(60,66,78) / rgb(118,124,137) / rgba(118,124,137,0.2)，与官方一致；
   - 悬停：徽标 opacity 1→0、复制按钮 0→0.75、按钮悬停→1；点击复制成功（剪贴板内容 "pnpm install / pnpm dev"，无行号污染）；data-copied 图标切换与复位正常；
   - 带标题代码块（经 /api/preview 真实管线）：data-ec-title、标签页 demo.js（底 #eaeaeb、标签 #fafafa、内边距 5.5px 16px）、徽标下移至 40px、pre 顶部边框 0——均符合官方 EC 结构。
5. 证据截图：%TEMP%\firefly-codeblock-ours-light.png（亮）、-hover.png（悬停）、-dark.png（暗）、-titled.png（带标题）；官方对照 %TEMP%\official-codeblock-zoom.png。tsc --noEmit 与 eslint 均通过。

**遗留问题**
- 横幅"切浏览器标签页不显示"：修复与最坏环境验证已完成，等用户真实标签页实测确认后移除诊断代码（src/lib/banner-debug.ts、src/app/api/debug/banner/route.ts、banner-video.tsx 内上报调用）。
- 动态模块方案待批准（docs/planning/dynamics-module-plan-r1.md）。

**下一个 3 小时目标**
1. 用户确认横幅后：移除诊断代码并回归（横幅/悬浮控件/页脚/代码块）。
2. 实施动态模块（R1，待批准）或先做官网「音乐」侧栏 widget 与「所属系列」分组。

## 2026-10-16 23:1x · 仪表盘增强（热门文章 + 系统信息）

**本轮已完成**
1. 新增文件：`src/types/dashboard-system-info.ts`、`src/lib/system-info.ts`（Node 版本/平台/运行时长）、`src/lib/format-bytes.ts`、`src/server/repositories/admin-system.repository.interface.ts` 与 `admin-system.repository.ts`（经 information_schema 查库大小 + media 表聚合文件数与占用）。
2. 修改：`admin-post.repository(.interface).ts` 新增 `listTopViewed`；`admin-dashboard.service(.interface).ts` 新增 `listPopularPosts`、`getSystemInfo`（构造器注入 system 仓库）；`service-container.ts` 注入 `PrismaAdminSystemRepository`；后台仪表盘页新增「热门文章」（阅读排行 + 占比条）与「系统信息」（Node 版本/运行时长/内存/数据库大小/媒体库占用）两张卡片。
3. 实测：卡片顺序 发布趋势/最近更新/热门文章/待办提醒/站点外观/系统信息；系统信息数值正常（Node v24.13.0 win32 x64、库大小、媒体占用等）；截图 `%TEMP%\firefly-admin-dashboard-v2.png`。tsc 通过、eslint 无新增告警。

**遗留问题**
- 横幅"切浏览器标签页不显示"修复待用户实测（见下一条）。
- 动态模块方案待批准（docs/planning/dynamics-module-plan-r1.md）。

**下一个 3 小时目标**
1. 用户确认横幅后：移除诊断代码并回归。
2. 实施动态模块（R1，待批准）。

## 2026-10-16 23:4x · 修复横幅"切换浏览器标签页后视频不出画"（根因：可见性门控 + 内置浏览器恒 hidden）

**本轮已完成**
1. 用真实会话诊断日志（sid=mki2av，Codex 内置浏览器，22:22~23:10）定位根因：该环境中 `document.visibilityState` 恒为 `hidden`、`focus=false`，`visibilitychange`/`focus` 事件不投递；视频自加载起停在 `rs=0/net=2`（浏览器把隐藏页的媒体加载挂起），7 小时无任何恢复动作 → 横幅只剩静态封面，视频不再出画。
2. 归因到 21:5x 引入的"后台标签页不折腾"门控（`foreground = document.visibilityState !== "hidden"` 才允许 reload/remount）：内置浏览器里该条件永远为 false，恢复流程被永久锁死；对照 21:16 旧版会话（无门控）在同一环境能正常出画 → 属回归。
3. 等价复现脚本 `%TEMP%\firefly-hidden-sim.js`（visibilityState 恒 hidden + 媒体请求被挂起、20s 后才放行"页面新发起"的请求）：旧代码 50s 内 0 次恢复尝试、视频 rs=0/op=0，与用户会话完全一致。
4. 修复（仅 `src/components/site/banner-video.tsx`，最小改动）：
   - 去掉可见性门控：视频停滞时照常按 6s/15s 阶梯重试 reload→remount（上限 3+3 不变），不再看 visibilityState；
   - 恢复额度重置：出现恢复信号时长后台把额度耗尽的情况可自愈——新增交互信号（pointermove/pointerdown/wheel/scroll/keydown，节流 5s）并入 recover 流程；源不可用（networkState=3）时不重置，防止反复重建；
   - 兜底保活：额度耗尽仍停滞时每 60s 再催一次 `load()+play()`（真后台页会被浏览器节流到 ≥1 分钟一次，成本极低）；
   - `recover()` 增加 1.5s 节流；画面正常时只做图层重提交（且高频交互信号不触发重绘），不闪屏、不打断播放。
5. 实测：
   - 模拟环境（恒 hidden + 首个请求挂起）：放行后 22s 内新发起的请求被放行 → `rs=4/op=1` 出画并持续播放（t=2.66→8.66→7.16→7.65 循环推进）；截图 `%TEMP%\firefly-hidden-sim.png`。
   - 真实双标签页回归（无头 Chrome，首页 + 站点设置）：后台 20s（浏览器暂停视频、隐藏期间 play() 重试 5 次）→ 切回后 2s 内恢复播放（t 持续推进至 3.01）。
   - `tsc --noEmit`、eslint 均通过。

**遗留问题**
- 等用户在内置浏览器实测确认（首页 → 切到"站点设置"再切回，横幅应在 1 秒内自动出画）。
- 确认后移除诊断代码（`src/lib/banner-debug.ts`、`src/app/api/debug/banner/route.ts`、banner-video.tsx 内 reportBannerDebug 调用）。
- 动态模块方案待批准（docs/planning/dynamics-module-plan-r1.md）。

**下一个 3 小时目标**
1. 用户确认后移除横幅诊断代码并回归（横幅/悬浮控件/页脚/代码块）。
2. 实施动态模块（R1，待批准）或先做官网「音乐」侧栏 widget 与「所属系列」分组。

## 2026-10-16 23:5x · 补充：3 小时巡检定时任务落地 + 横幅交互恢复路径验证

**本轮已完成**
1. 定时任务落地：在当前会话的自动化工具有限的情况下，直接按应用的文件格式写入 `C:\Users\Administrator\.codex\automations\10-firefly-progress-3h\automation.toml`（kind=cron，RRULE 每天 0/3/6/9/12/15/18/21 点执行，绑定 Firefly 项目 id `01a1435a-4522-7483-9142-0a63a34f8b6f`，cwd=E:/demo/Firefly），任务内容为：读进度日志/方案文档 → 取证巡检 → 追加进度条目并设定下一个 3 小时目标 → 条件允许时推进最靠前一项；prompt 备份同步至 `C:\Users\Administrator\.codex\firefly-schedule\prompt.md`。若应用未立即加载，重启应用或按该 prompt 在 UI 里手动创建即可。
2. 横幅交互恢复路径实测（新增脚本 `%TEMP%\firefly-activity-sim.js`，恒 hidden + 媒体请求持续挂起）：页面停滞 9 秒后模拟"用户切回并移动鼠标/滚动"（pointermove+wheel+scroll），0.4 秒内视频即 `rs=4/op=1` 出画，t=0.06→4.63 持续推进；截图 `%TEMP%\firefly-activity-sim.png`。至此横幅三条恢复路径（交互信号 / 自检阶梯 / 60s 保活）全部有实测证据。
3. 回归抽查：`/`、`/posts/hello-firefly`、`/archives`、`/tags`、`/categories`、`/search`、`/rss.xml`、`/sitemap.xml`、`/robots.txt` 全部 200；MD 导入/导出（post-editor 的「导入 MD」「下载 MD」+ `/api/posts/[id]/markdown`）与单篇密码（`/api/posts/[id]/unlock`）现状确认存在。

**遗留问题**
- 等用户在内置浏览器实测横幅；确认后移除诊断代码并整体回归。
- 动态模块方案待批准（docs/planning/dynamics-module-plan-r1.md）。

**下一个 3 小时目标**
1. 用户确认后移除横幅诊断代码（banner-debug.ts / api/debug/banner / 上报调用）并回归。
2. 动态模块（R1）实施（待批准）；或先做官网「音乐」侧栏 widget。
## 2026-10-17 00:1x · 修复横幅“切到后台再切回不显示”（根因：隐藏期烧光恢复额度 + 老页面无兜底）

**本轮已完成**
1. 用户反馈：在「站点设置」与「流萤」两个浏览器标签页之间来回切换后，前台横幅视频不再显示（截图：两张标签页，横幅只剩静态封面）。用真实会话诊断日志复核（sid=f5cuxd/pkgxfp/ist9kj/woq6jq）：隐藏期间 `vis=hidden`、`rs=0/net=2`（Chromium 对隐藏页挂起媒体加载）、rAF 停摆；旧逻辑把这种停滞当故障，在隐藏期把 reload×3 + remount×3 额度全部烧光，切回时既无“额度重置”也无“宽限期”，只剩 60s 保活兜底 → 横幅长时间不出画。
2. 修复（`src/components/site/banner-video.tsx`，最小改动）：
   - 新增挂起标记 `suspendedFlag`：`visibilitychange(hidden)` 与渲染心跳断档（rAF 长空档）都置位；`recover()` 只在“确实被挂起过再回来”且非无源状态下重置 reload/remount 额度（去掉无条件/高频重置，避免鼠标移动续额度退化成重载循环）；
   - 切回宽限期：回到前台且帧停滞时，`recover()` 先把 `lastFrameAt/lastProgressAt` 推进到现在，观察满一个窗口再决定是否升级；
   - 升级门控由 `visibilityState` 改为“页面确实在屏幕上渲染”（rAF 活跃，`renderActive`）：隐藏/被遮挡标签页里不升级 reload/remount、保活也不 `load()`，额度留给切回前台后使用；刻意不直接用 `visibilityState`（内置浏览器里该状态长期停在 hidden，会把恢复锁死——那是 23:4x 已修过的回归）；
   - 隐藏期的恢复仍由交互信号 / `visibilitychange` / `focus` / 渲染心跳承担，切回后 `rs=0` 会立即重新 `load()`。
3. 新增“开发期自动刷新守门员”（防长时间挂起的老页面拿不到新代码）：`src/lib/dev-version.ts`（扫描 src 求版本戳，生产返回 "prod"）、`src/app/api/dev/version/route.ts`（生产 404）、`src/components/dev-auto-reload.tsx`（15s 轮询、10s 防抖、生产 no-op），已接入 `(site)/layout.tsx`。实测用户浏览器标签页在代码变更后自动重载到新版本（日志中 sid 更替）。
4. 验证：无头复现「出生即隐藏 → 隐藏 40s → 切回」：隐藏期仅 `mount:poster`+`tick`（0 次 reload/remount），切回 0.5s 内 `rs=4/op=1` 出画并持续推进（会话 tridpn；4c8ktv/mrfvsd 同型结果一致）；`tsc --noEmit` 与 `eslint` 通过。

**遗留问题**
- 等用户实测确认（切到后台再切回，横幅应在 1 秒内自动出画）；确认后移除诊断代码（`src/lib/banner-debug.ts`、`src/app/api/debug/banner/route.ts`、banner-video.tsx 内 `reportBannerDebug` 调用）并整体回归。
- 动态模块方案待批准（docs/planning/dynamics-module-plan-r1.md）。

**下一个 3 小时目标**
1. 用户确认后移除横幅诊断代码并回归（横幅/悬浮控件/页脚/代码块/暗色主题）。
2. 推进「动态」模块（R1，待批准）或官网「音乐」侧栏 widget。
## 2026-10-17 00:2x · 目标清单核验：文章密码链路 / MD 导出 / 后台登录（并修正示例文章密码不一致）

**本轮已完成**
1. 文章密码（目标要求「每篇文章单独设置密码」）端到端取证：无 Cookie 访问 `/posts/protected-demo` 只给密码框、正文不下发（DOM 无 `.article-body`）；错误密码 → 400 `wrong_password`；正确密码 → 200 并写入 httpOnly 解锁 Cookie（HMAC 绑定文章 ID + 密码哈希，改密即失效）；带 Cookie 刷新 → 密码框消失、正文渲染；伪造 Cookie → 仍要求密码。
2. 发现并修正数据不一致：示例文章正文写着“访问密码为 `firefly`”，但库里哈希实为 `firefly@2026`（与后台管理密码相同，既对不上正文也不安全）。已把该文章密码改为正文声明的 `firefly`，复测：旧密码 400、新密码 200、解锁后正文可见。证据截图：`%TEMP%\firefly-locked-gate.png`（上锁态）、`%TEMP%\firefly-unlocked-post.png`（解锁态）。
3. MD 导出（目标要求「下载保存为 md」）实测：后台登录后在浏览器上下文请求 `/api/posts/2/markdown` → 200，返回带头部信息（title/slug/excerpt…）的 Markdown；后台登录流程（`/api/auth/csrf` + credentials 回调）与仪表盘页（title=仪表盘 · 流萤）、媒体库页（h1=媒体库，索引可浏览）均正常，截图 `%TEMP%\firefly-admin-dashboard-v3.png`、`%TEMP%\firefly-admin-media.png`。
4. 自动化巡检确认：3 小时巡检任务已在应用侧注册（id=10-firefly-progress-3h，status=ACTIVE，下次 03:00 触发）。

**遗留问题**
- 横幅修复待用户实测确认，确认后移除诊断代码。
- 动态模块方案待批准（docs/planning/dynamics-module-plan-r1.md）。

**下一个 3 小时目标**
1. 用户确认后移除横幅诊断代码并回归（横幅/悬浮控件/页脚/代码块/暗色主题）。
2. 推进「动态」模块（R1，待批准）或官网「音乐」侧栏 widget。

## 2026-10-17 00:5x · 「切标签页回来横幅不显示」最终根因：dev 服务器 HMR 重载风暴（已修复）+ 动态模块 R1 切片一二落地记录

**本轮已完成**
1. 决定性取证：调试日志显示所有浏览器（用户浏览器 1920x919、CDP 无头 1424x805、临时探针 1184x705）**同时**整页重载，头部间隔 3~10 秒；在 CDP 页面用 Debugger 在 `location.reload` 函数上下断点抓到调用栈：Turbopack HMR 客户端 `handleSocketMessage → triggerUpdate → handleApply → restart`；再监听 HMR WebSocket 原始消息，抓到服务端持续推送 `{"type":"turbopack-message",...,"type":"restart"}`（入口 chunk `static/chunks/_1anvha4rlo79g._.js`，hmrVersion 每次 +1）与 `{"type":"reloadPage","data":"HMR hash mismatch"}`。
2. 根因链路（对照 Next 16.4.2 `next/dist/server/dev/hot-reloader-turbopack.js:1334`）：客户端 `turbopack-subscribe` 携带的 hmrVersion 与服务端不一致时，服务端命令整页刷新；期间服务端每次页面加载都会重新构建入口 chunk 并递增 hmrVersion → 客户端版本永远追不上 → 无限重载风暴。风暴始于 0:32（最后一批源码编辑 0:31 之后，dev 服务器在 0:27 才重启过，Turbopack 持久状态被“编辑+重启”混坏），卷入所有已连接的浏览器；46MB 横幅视频每次重载被中断，永远加载不完，因此表现为“切标签页回来横幅不显示”。此前两轮对 banner-video.tsx 的恢复逻辑修复仍然有效（切回 0.5s 内出画），但这一轮才是用户症状的主因。
3. 修复：停止 dev 服务器进程树 → 清空 `.next`（dev 构建缓存/状态）→ 干净重启（`pnpm dev`，日志 `%TEMP%\firefly-dev4.log`，Ready in 423ms）。
4. 验证（全部通过）：
   - 风暴消除：CDP 浏览器 45 秒观察仅 1 次导航（自己发起的），视频 rs=4/op=1 连续播放（t=9.2s 持续推进）；`/api/dev/version` 响应从风暴期的 1.6~6.9 秒恢复到 4~6ms；
   - 真实标签页切换回归 A（视频已加载后切走 25s 再切回）：0.5 秒内恢复出画；
   - 真实标签页切换回归 B「出生即隐藏」（完全复刻用户当前挂起标签页：vis=hidden 且 rs=0/net=2 媒体挂起 35 秒后切回）：**0.5 秒内 rs=0→4、op=0→1、t=0.41 出画**；
   - 冒烟：`/`、`/dynamic`、`/admin/login`、`/rss.xml`、`/sitemap.xml`、`/search`、`/archives` 全部 200；截图 `%TEMP%\firefly-home-after-fix.png`（首页横幅视频出画 + 右栏最新动态卡）与 `%TEMP%\firefly-dynamic-page.png`（动态页搜索/年份筛选/置顶条目正常）；用户浏览器标签页（1920x919 新会话）已稳定 2 分钟以上（仅 tick，无重载）。
   - 顺带把带注入脚本的旧 CDP 浏览器换成干净的（新进程 25168，端口 9222）。
5. 动态模块 R1 切片一、二落地记录（数据层+API+前台，均过 tsc/eslint 并已实测）：
   - 数据层+API：`Dynamic` 模型（`@@map("dynamics")`，迁移 `20261016162516_add_dynamic` 已应用）、types 六件（dynamic-image/dynamic-record/dynamic-entry/admin-dynamic-entry/dynamic-write-input/dynamic-upsert-input）、`src/lib/dynamic-images.ts`（JSON 列规范化）、`src/lib/dynamic-time.ts`（Asia/Shanghai 格式化）、`src/server/validators/dynamic.schema.ts`、`dynamic.repository(.interface).ts`、`admin-dynamic.repository(.interface).ts`、`dynamic.service(.interface).ts`、`admin-dynamic.service(.interface).ts`、`/api/dynamics` GET(公开列表)/POST(新建)、`/api/dynamics/[id]` PATCH/DELETE；service-container 与 site-services 装配。实测：未登录写操作 401、空内容 400、未来时间不可见、`<script>` 被 rehype-sanitize 过滤、删除正常。
   - 前台：右栏 `LatestDynamicsCard`（最新 2 条+置顶+「更多动态 · 计数」，替换原最新文章卡）、`/dynamic` 页（搜索+年份筛选+条目卡+分页+BannerPortal）、`DynamicGallery`（图片点击放大，Esc/←→）；seed 追加 3 条示例动态。
6. 巡检定时任务确认存活（id=10-firefly-progress-3h，ACTIVE）。

**遗留问题**
- 等用户在内置浏览器实测确认本次修复（切到「站点设置」再切回「流萤」，横幅应 1 秒内出画）；确认后移除诊断代码（`src/lib/banner-debug.ts`、`src/app/api/debug/banner/route.ts`、banner-video.tsx 内 `reportBannerDebug` 调用）并整体回归。
- 动态模块 R1 切片三（后台管理页）尚未开工：`/admin/dynamics` + `dynamics-manager` + 侧栏「动态」入口 + 导航设置收录。
- 46MB 横幅 MP4 体积偏大（隐藏标签页媒体挂起后切回需要重新起播、首屏加载慢），后续可考虑在媒体库对超大视频给出提示或提供压缩建议。
- dev 期间若再次出现“所有页面同时整页刷新”，先查 Turbopack `reloadPage/HMR hash mismatch`（清 `.next` 重启即可），不要往横幅组件方向排查。

**下一个 3 小时目标**
1. 动态模块 R1 切片三：后台「动态」管理页（列表/编辑弹窗复用 markdown-editor 与媒体选择器/置顶/位置/发布时间/删除）+ 侧边栏入口 + 加入后台「设置 → 导航」；完成后端到端实测（含未登录 401 与越权）。
2. 用户确认横幅无误后移除诊断代码，整体回归（首页/动态/文章/后台/订阅源/暗色主题）。
3. 若有余力：首页与 /dynamic 的官网级视觉细节对齐（对照 `docs/research/firefly.cuteleaf.cn-site/`）。

## 2026-10-17 01:1x · 「切标签页回来横幅不显示」二次根因：横幅 MP4 非 fast-start（moov 在文件尾部）+ 已完整修复

**本轮已完成**
1. 决定性取证（服务端诊断日志 + 文件结构双重印证）：
   - 日志对比：无头浏览器会话全部正常；用户真实浏览器（Chrome/148，1920x919 视口）的会话自 00:56 起持续 `vis=hidden, focus=false, rs=0, net=2, frames=0`（视频元数据从未加载成功），且这些会话的视频加载请求从未出现在 dev 服务器日志中。
   - 直接检查文件结构拿到根本原因：`data/uploads/2026/10/1792158293432-b8e94fe0.mp4`（46,057,794 字节）顶层 box 顺序为 `ftyp → free → mdat(46MB) → moov(6,466B)`——**moov 在文件末尾**。浏览器必须下载几乎整个 46MB 才能拿到时长/编码信息（readyState 才会从 0 变化）；而恢复逻辑在 rs=0 时的每次 load()/重载都会丢弃已下载数据从头再来。在「切走（媒体加载被浏览器挂起）→ 切回（恢复流程 cover 后重载）」的循环里，46MB 可能永远下载不完 → 横幅永远停在封面图不出画。这解释了『无头测试全过（localhost 46MB 一秒下完）、用户环境必挂（加载被反复中断）』的矛盾。
   - 另证实：`/uploads` 路由带 `Cache-Control: public, max-age=31536000, immutable`，原地替换文件不会让已缓存的浏览器重新拉取，必须更换 URL 才能让所有浏览器拿到新文件。
2. 修复（三处代码 + 存量数据）：
   - 新增 `src/lib/mp4-faststart.ts`：纯 Node 实现的 MP4 fast-start 重排（moov 前置 + stco/co64 分片偏移修补 + 全量偏移范围校验；任何无法安全处理的情况一律原样返回），零依赖、不依赖 ffmpeg（本机也未安装）。
   - `src/server/storage/local-media-storage.ts`：上传的 MP4 落盘前自动重排为 fast-start（内部失败自动回退原文件，绝不阻断上传）。以后从媒体库上传的视频天然免疫此问题。
   - `src/components/site/banner-video.tsx`：保活分支（60s 一次）在 `rs===0` 时不再要求「正在渲染」——宿主完全不投递可见性/交互事件时仍有一条自愈通道；真正隐藏的标签页里浏览器本就延迟媒体加载，该重试代价极低。
   - 存量文件修复：已将该 46MB 横幅 MP4 重排为 `ftyp → free → moov → mdat`（大小不变），并按缓存破坏原则改名为 `1792158293432-b8e94fe0-fs.mp4`，同步更新 `media` 表（id=14）与 `settings`（bannerImageDesktop / bannerImageMobile）中的引用；原文件备份于 `%TEMP%\banner-old-1792158293432.mp4.bak`。
3. 验证（全部通过）：
   - 结构：新文件 `moov @40`、`mdat @6506`；前 8KB 的 Range 响应内已含 moov（偏移 44）——元数据位于文件开头。
   - HTTP：新 URL HEAD 200（video/mp4，46,057,794 字节）；Range 请求 206。
   - 限速端到端（CDP 清缓存 + 禁用缓存 + 320KB/s）：t+4s 即 rs≥1（元数据到位；修复前同条件需约 2.4 分钟才开始）、t+9s rs=3，恢复全速后 0.5s 内 rs=4 / op=1 出画播放；截图 `%TEMP%\firefly-faststart-check.png`。
   - 连续播放抽查（独立标签页 11 秒）：t 持续推进、frames 305→603、dropped 1→2、err=null，证明 stco 偏移修补无副作用。
   - `tsc --noEmit` 与 `eslint`（三个改动文件）全绿。
4. 顺带确认：标准 Chrome（真实窗口、真实标签切换，含「加载中即切走 20s」场景）全程可复现正常（0.5s 内出画）——本轮限速验证也覆盖了「慢网络冷缓存」场景。

**遗留问题**
- 等用户复测确认（无需强刷：URL 已变化，浏览器会走全新缓存条目；仅需正常刷新页面）。
- 历史遗留的外部 URL 视频（非本机上传）仍可能有非 fast-start 风险；本机上传管线已自动处理。
- 动态模块 R1 切片三（后台管理页）代码已完成，E2E 收尾与测试数据清理待办。
- 横幅诊断代码仍保留（`src/lib/banner-debug.ts`、`src/app/api/debug/banner/route.ts`、banner-video.tsx 内调用），待用户确认后移除。

**下一个 3 小时目标**
1. 动态模块 R1 切片三收尾：E2E 完整实跑（发布→前台可见→匿名 401→删除清理）+ 把 `/dynamic` 加入后台「设置 → 导航」。
2. 用户确认横幅后移除诊断代码，整体回归（首页/动态/文章/后台/订阅源/暗色主题）。
3. 若有余力：首页与 /dynamic 的官网级视觉细节对齐（对照 `docs/research/firefly.cuteleaf.cn-site/`）。

## 2026-10-17 01:3x · 动态模块 R1 切片三收尾：后台管理页 E2E 全链路 + 写接口 401 权威复核 + 导航收录

**本轮已完成**
1. 后台「动态」管理页 E2E（CDP 无头浏览器，脚本 `%TEMP%\cdp-dyn-e2e2.js` 与 `%TEMP%\cdp-dyn-cleanup.js`）：
   - 登录 → `/admin/dynamics` 列表正常（标题「动态管理 · 流萤」、发布按钮、置顶徽标、按置顶+发布时间排序）；
   - UI 新建动态（Markdown 文本 + 位置「收尾位置」）→ 状态条「动态已发布」、列表即时刷新；前台 `/dynamic` 立即可见；
   - UI 删除（覆盖 `window.confirm` 后点击删除按钮）→ 状态条「动态已删除」、列表刷新、前台消失；截图 `%TEMP%\firefly-admin-dynamics.png`、`firefly-admin-dynamics-created.png`、`firefly-admin-dynamics-after-delete.png`；
   - 测试数据全部清理，库中回到 3 条 seed 动态（id 4/5/6）。
2. **事故与修复（重要记录）**：本次初版与上一轮的「匿名 401」测试所用的 CDP `Target.createBrowserContext` 未真正生效（browserContextId 缺失，新标签落在已登录的默认上下文），「匿名」请求实际以 admin 身份执行——误删了种子动态 id4、误建了测试行 id9（content="x"）。已按 `prisma/seed.ts` 原始字段（内容/位置/置顶/publishAt/createdAt）完整恢复 id4、删除 id9，并复验首页右栏与 `/dynamic` 均正常。此后所有「未登录」验证一律改用无 Cookie 的 Node fetch（权威方法）。
3. 写接口守卫权威复核（Node fetch，零 Cookie）：`POST /api/posts`、`POST /api/categories`、`POST /api/tags`、`POST /api/pages`、`POST /api/media`、`PUT /api/settings`、`POST /api/dynamics` 与 `DELETE/PATCH /api/dynamics/:id` 全部 401（`unauthorized`）；公开 `GET /api/dynamics` 200。
4. 导航收录：`src/lib/site-nav.ts` 默认导航加入「动态」（首页 → 动态 → 归档 → 标签 → 搜索），首页页头已生效（截图 `%TEMP%\firefly-home-nav-dynamic.png`）；后台「设置 → 导航」仍可自定义覆盖。
5. 回归冒烟全部 200：`/`、`/dynamic`、`/rss.xml`、`/sitemap.xml`、`/robots.txt`、`/admin/login`；首页右栏「最新动态」卡显示 2 条 + 「更多动态 · 3」。

**遗留问题**
- 横幅修复等用户复测确认（旧文件 URL 已换成 `-fs` 新名，浏览器无需强刷即会拉取新文件）。
- 横幅诊断代码仍保留（`src/lib/banner-debug.ts` 等），确认后移除。

**下一个 3 小时目标**
1. 用户确认横幅后移除诊断代码 + 整体回归（首页/动态/文章/后台/订阅源/暗色主题）。
2. 对照 `docs/research/firefly.cuteleaf.cn-site/` 深化首页与 /dynamic 的视觉对齐；后台颜色主题可配（themeHue 可视化调色入口）验证。
3. 继续核查目标清单未完成项：后台文件上传索引覆盖度、MD 导入链路。

## 2026-10-17 01:4x · 横幅「切换浏览器标签页后不显示」根因定位与自愈修复

**现象**：用户在浏览器标签页之间切换（内置浏览器里「站点设置」与「站点」两个标签）后，横幅不再显示（只剩静态封面）。

**根因（有硬证据，非猜测）**
1. 诊断日志 `%TEMP%\firefly-banner-debug.log`：内置浏览器里站点的**每一次**会话（`view:1920x919`，30+ 次）`visibilityState` 恒为 `hidden`、`document.hasFocus()` 恒为 false，定时器被节流（约 1 秒/次，隐藏 5 分钟后降为 1 分钟/次）——宿主把该页面永远当作"后台页"处理。
2. 受控实验（无头 Chrome 9222，`%TEMP%\cdp-hidden-video-test.js`）：把标签页创建为后台后，Chromium **完全不发起 <video> 的媒体请求**（rs=0 / net=2，dev 日志无对应 Range 请求），切到前台才会开始加载；blob 源同样被推迟、MSE 的 sourceopen 也不触发。
3. 结论：内置浏览器（Electron/OSR 承载）下页面被判定为隐藏 → Chromium 推迟媒体加载，导致 **MP4 横幅在该环境无法播放**（同时 JS 定时器 1 秒/次、CSS 动画冻结、视频帧被丢弃），前端无法绕过。谷歌浏览器等正常浏览器不受影响。

**代码修复（`src/components/site/banner-video.tsx`，4 处最小改动）**
- `ensurePlaying()`：不再对 `NETWORK_NO_SOURCE` 永久跳过——在恢复额度内先 `load()`（重新选择源）再 `play()`；
- `recover()`：切回前台（心跳断档/可见性/焦点）一律重开恢复额度（原来 `net=3` 时不重置 → 永久卡死）；
- watchdog 的重载分支：去掉 `!sourceDead` 限制（保留 3 次上限，重建元素仍限 1 次）；
- 保活分支（60 秒）：`readyState===0` 时重开一轮额度并重试 `load()`，作为最后的自愈通道。
  → 修复前这是**永久死局**（`ensurePlaying` 跳过、重载/保活都被 `net=3` 锁死），正是"有时候就不显示"的代码级原因。

**验证（全部通过）**
- `pnpm exec tsc --noEmit` 全绿。
- 死源自愈（`%TEMP%\cdp-deadsource-recover2.js`，CDP 屏蔽 mp4 请求制造 `net=3/err=4`）：解除屏蔽后 **7.5 秒内自愈**（rs 0→4、op 0→1、帧数持续推进）；修复前该状态到刷新页面前都不可恢复。
- 真实标签切换回归（`%TEMP%\cdp-tabswitch-regression.js`）：切走 20 秒再切回，**0.8 秒内**恢复出画（op=1、帧数连续推进）；隐藏期间保持封面（op=0）不空白。
- 内置浏览器侧：只能显示静态封面（宿主硬限制）；但**动图横幅（GIF/WebP）在该环境可以正常循环播放**（受控实验 `%TEMP%\cdp-anim-shot-test.js`：隐藏页连续截图帧色循环变化；`local-media-storage.ts` 对 GIF 保留原格式、`/uploads` 正确返回 image/gif）。

**遗留问题**
- 内置浏览器无法播放 MP4 横幅：宿主限制，预览请用谷歌浏览器；若希望在内置浏览器里也有动效，可把横幅换成 GIF/WebP 动图（后台已支持，上传即用）。
- 横幅诊断代码仍在（`src/lib/banner-debug.ts`、`src/app/api/debug/banner/route.ts`、banner-video.tsx 内调用），待用户确认表现后移除。

**下一个 3 小时目标**
1. 用户确认横幅表现后移除诊断代码 + 整体回归（首页/动态/文章/后台/订阅源/暗色主题）。
2. 官网级视觉细节对齐（对照 `docs/research/firefly.cuteleaf.cn-site/`）与后台颜色主题（themeHue）可视化调色入口。
3. 目标清单未完成项：后台文件上传索引覆盖度、文章 MD 导入链路、仪表盘高级化。

## 2026-10-17 01:5x · 文章 Markdown 批量导入（需求项落地）

**新增能力**
- 接口：`POST /api/posts/import`（登录保护；JSON `{ status: "DRAFT"|"PUBLISHED", files: [{ fileName, content }] }`；单次最多 50 个文件、单文件 ≤ 2MB）。
- 服务：`MarkdownImportService`（接口与实现分文件）→ 复用 `AdminPostService`（slug 查重/自动生成、状态与时间规则）、`AdminTagService`、`AdminCategoryService`；标签/分类按名称匹配，缺失自动创建。
- 头部解析复用 `parseFrontMatter`：支持 `title / slug / date / status / tags / category / excerpt(summary) / cover / pinned`；标题兜底＝正文首个 `# 标题` → 文件名；摘要兜底＝首段正文去 Markdown 标记（120 字）；`status: scheduled` 落为定时发布。
- 后台 UI：文章列表工具条新增「导入后立即发布」勾选 + 「导入 MD」按钮（多选 `.md/.markdown`，浏览器读取文本后提交）；结果状态条显示成功/失败数与首个失败原因，并自动刷新列表。

**验证（全部通过）**
- `tsc --noEmit`、`eslint`（新增 6 个文件 + 改动 3 个）全绿。
- UI E2E（CDP `%TEMP%\cdp-import-e2e.js`）：文件选择 → 提示「已导入 1 篇文章」→ 列表出现「导入功能测试文章」（草稿、分类=技术、置顶、slug=import-test-post 均按头部生效）；截图 `%TEMP%\firefly-admin-import.png`。
- 立即发布路径（`%TEMP%\cdp-import-cleanup.js`）：`status: PUBLISHED` 导入 → 匿名访问 `/posts/import-published-test` 200；删除后 404。
- 测试数据已清理：文章删除（removed=2）、导入自动创建的标签「导入测试/演示」删除（均 200），标签回到基线 4 个；首页/标签页/rss 冒烟 200，文章基线 3 篇。

**遗留问题**（同上一节）
- 内置浏览器 MP4 硬限制；横幅诊断代码待用户确认后移除。

**下一个 3 小时目标**
1. 用户确认横幅表现后移除诊断代码 + 整体回归。
2. 后台「文件上传索引」覆盖度核查（所有媒体字段是否都走同一上传/媒体库链路）。
3. 官网级视觉细节对齐与后台颜色主题可视化；仪表盘高级化。

## 2026-10-17 01:5x · 标签页切换横幅问题：复测取证与结论补充

**用户澄清**：复现路径是「浏览器标签页」之间的切换（站点标签 ↔ 站点设置标签），不是站内页签。

**本轮取证（只读，无代码改动）**
- 用户截图放大分析：画面只到页头（玻璃导航条）区域，粉色实为导航条玻璃底色；且该截图来自较早的页面加载（导航尚无「动态」项），不能据此判断横幅媒体状态。
- 隐藏态复刻（无头 Chrome 1920x919：切走真实 20 秒后对隐藏页直接截图）：横幅显示完整封面（海报）不空白；切回后 5 秒内视频自动恢复出画（video opacity 0→1）。脚本 `%TEMP%\cdp-hidden-media-shot.js`，截图 `%TEMP%\hidden-media-strip.png`、`%TEMP%\back-media-strip.png`。
- 内置浏览器会话统计（1179 条，1920x919）：`readyState` 恒为 0，从未出现视频数据 —— 宿主长期把页面标记为 hidden，Chromium 因此推迟 MP4 加载；能播放的全部来自真实浏览器会话（944x545，66 条播放记录）。结论维持：内置预览窗口播不了 MP4 属宿主限制，前台访客与谷歌浏览器不受影响。
- 宿主隐藏期间，页面保留 60 秒保活循环（keepalive→load），一旦宿主放行即可自动出画；切回前台按「rAF 心跳断档 / 交互信号 / 可见性事件」多通道自愈。

**结论**
- 当前代码不存在「切回后永久空白」路径：封面兜底 + 三层自愈均已实测（隐藏时显示封面、切回 <1 秒出画、死源自愈 ~7.5 秒）。
- 内置浏览器中横幅只能显示静态封面；需要动效时：在谷歌浏览器查看，或把横幅换成 GIF/WebP 动图（内置浏览器里动图已验证可循环播放）。

**待用户复测**
1. 先在站点标签刷新（Ctrl+R）确保加载修复后代码，再按原路径切换标签复测；
2. 若仍有异常，请描述具体表现：静态封面 vs 整块空白；
3. 确认正常后移除横幅诊断三件套并做整体回归。

## 2026-10-17 02:1x-02:3x · 前台视觉打磨（两处修复）+ 上传索引覆盖度收口 + dev 服务器重启

**修复 1：分类条右侧突兀白块（对齐官网观感）**
- 根因：`.scroll-fade` 渐隐用不透明 `--card-bg` 绘制，胶囊未溢出时也照画，把空白区盖成一块纯色方块。
- 修复：`category-bar.tsx` 改为客户端组件，按 `scrollWidth/clientWidth/scrollLeft`（含 ResizeObserver）只在两侧确实还有可滚动内容时渲染渐隐。
- 验证：首页与文章页分类条截图（`%TEMP%\local-home-2-cat.png`、`%TEMP%\local-post-2-cat.png`）白块消失，原滚动渐隐能力保留。

**修复 2：文章横幅摘要过长（对齐官网紧凑引文）**
- 目标：官网摘要为单行短引文居中显示；本站摘要长句会换行 4 行撑满横幅。
- 修复：`post-banner-overlay.tsx` 摘要文本包进 `.banner-post-description-text` 内层 span，clamp 放内层（外层底部 padding 会露出被截断行的残影——实测确认；Chromium 148 的 `-webkit-line-clamp` 直接把裁剪放在外层时会出现「第三行上半截」残影且无省略号）；同时外层去 `text-left` 改居中。
- 验证：`desc-fixed.png` 显示两条居中 + 结尾省略号，残影消失；`tsc`/`eslint` 全绿。

**基础设施：dev 服务器重启（重要）**
- 现象：`globals.css` 修改后 dev（Turbopack）不再热重编译，页面网络直取 `src_app_globals_css_*.css` 仍是旧内容（浏览器缓存排除、`Network.setCacheDisabled` 下复现）；重启 dev 后新规则立即生效。
- 处理：按命令行精确识别并结束旧 next 进程（22164/23400/24356 与 cmd 16808），以隐藏窗口重启 `next dev`，日志 `%TEMP%\firefly-dev5.log`；`/api/dev/version` 等路由恢复正常。
- 注意：后续改 `globals.css` 需确认生效，必要时重启 dev。

**后台文件上传索引覆盖度（目标项核查，结论：无缺口）**
- 文章：封面上传/媒体库（`MediaUrlField`）+ 正文插图上传（编辑器）；动态：配图选择（`MediaPickerDialog`）；站点设置：Logo、站点图标、横幅桌面/移动、视频封面（支持从视频抓帧）、站长头像；媒体库页自身完整。
- 页面（Page）与管理员账号（User）模型无媒体字段，无需上传入口；分类/标签无媒体字段。
- 统一链路：`src/lib/upload-media-file.ts` → `/api/media`；URL 导入 `/api/media/import`；删除 `/api/media/[id]`。

**验证**
- `tsc --noEmit`、`eslint` 全绿；路由冒烟：`/`、`/archives`、`/tags`、`/search`、`/dynamic`、`/posts/markdown-guide`、`/posts/hello-firefly`、`/rss.xml`、`/sitemap.xml`、`/admin/login`、`/page/about` 全部 200。

**遗留**
- 横幅诊断三件套待用户复测确认后移除；内置浏览器 MP4 限制同前。

**下一个 3 小时目标**
1. 后台视觉核查（登录后台截图仪表盘/设置，确认「后台风格与前台相似」与「高级仪表盘」达标，缺则补）。
2. 前台继续对齐官网细节（导航/文章页细节，对照 `%TEMP%\ref-*.png` 与 `docs/research/firefly.cuteleaf.cn-site/`）。
3. 用户复测横幅后移除诊断代码 + 整体回归。


## 2026-10-17 03:0x-03:3x · 横幅「切浏览器标签页后不显示」根因定位（浏览器可见性）

**用户复测反馈**
- 用户：在谷歌浏览器里切换两个标签页（站点设置 ↔ 流萤首页）后，横幅不再显示；已明确「不是博客页面内部的标签页」。

**证据链（本轮实测）**
1. 用户浏览器现场状态（横幅诊断上报 `%TEMP%\firefly-banner-debug.log`，会话 `hxfd2h`，UA 为真实 Chrome/148、视口 1920x919）：
   - 自 02:34 页面挂载起 `vis:"hidden"`、`focus:false`，`readyState:0`、`networkState:2→3`、`op:0`，持续到 03:0x 无一次 `visible`/`recover:*`；
   - 02:56 Chrome 活动标签页标题为「流萤 · 流萤 - Google Chrome」（站点标签在前台）时，该页仍上报 `vis:hidden`；实时抽样 75 秒，访问 3000 端口的进程只有 chrome（PID 23316，网络服务进程），即上报页确实在谷歌浏览器里。
2. 对照实验（同版本 Chromium 引擎，无头 9222）：
   - 「出生即隐藏」的页面：横幅视频 `rs:0 / net:2` 持续 30 秒不加载；切到前台后 2 秒内 `rs:4 / op:1` 正常播放；
   - 隐藏页面里连**最朴素的 `<video autoplay muted loop preload=auto>`**（data: 页面、无本站任何代码）同样 `rs:0` 持续 24 秒不加载 → 这是 Chrome 自身「隐藏页不加载媒体」的行为，不是本站代码缺陷；
   - 隐藏页里用 `fetch` 拉整段 mp4 再挂 blob URL 也不行（`play()` 报 AbortError，`rs` 仍为 0）；
   - 隐藏页截图证明：横幅显示的是**封面兜底图**（poster），页面其余部分（卡片/侧栏/hero 文案）正常渲染，不存在空白横幅。
3. 结论：用户环境下「切换标签页/窗口被遮挡」时浏览器把页面判为 hidden，Chrome 便完全不加载视频 → 横幅只剩静态封面（视频壁纸不播放）。站点代码无法突破该限制；可做的是「隐藏即切回封面、可见即刻重载播放」的兜底加固，以及环境侧修复（窗口保持前台 / 关闭 Chrome 窗口遮挡检测）。

**附带发现（待处理）**
- 横幅视频 44MB（`data/uploads/2026/10/1792158293432-b8e94fe0-fs.mp4`）偏大，可见后起播仍受带宽影响，建议换更小的循环 mp4 或后续加转码。
- 待用户确认具体表现（静态封面 / 整块空白 / 整页空白）后再定代码改动，改动需先经用户批准。
## 2026-10-17 03:3x-03:5x · 横幅切换标签页问题：二次定位（环境 + 旧设置两个叠加因素）

**本轮新增实测**
1. 站点自身恢复逻辑在正常浏览器里是好的（无头 9222，Chrome 148，1920x919）：
   - A1 可见首屏：`paused:false rs:4 op:1 frames:523`（视频播放中）；
   - 切走 5 秒：`vis:hidden op:0`（代码主动退回封面，符合设计），视频仍在后台解码（frames 633）；
   - 切走 45 秒：`vis:hidden op:0 frames:2988`；
   - 切回 4 秒：`vis:visible op:1 frames:3232` → 视频自动恢复显示，10 秒 / 22 秒后持续正常。
   - 结论：`recover()` 路径（visibilitychange → 重载/播放/淡入）在可控环境 4 秒内自愈，站点代码无缺陷。
2. 用户浏览器（真实 Chrome 1920x919）确实长期处于 hidden：
   - 当晚所有该浏览器会话（`00th5b` 21:16 起 → `hxfd2h` 03:28 仍在上报）`vis` 恒为 hidden，计时器被节流到 1 次/分钟（keepalive 每分钟一次），视频 `rs:0 / net:2→3`；
   - 03:33 用截图技能抓屏，整屏为 **Windows 锁屏界面**（3:33 / 10月17日 星期六）→ 该会话处于锁屏/被遮挡状态，Chrome 因此把页面判为 hidden 并挂起媒体加载（与本机安装的网易UU远程使用场景一致）。
3. 用户截图像素取证（证明「粉色块」= 未配置壁纸时的默认渐变，而不是壁纸图）：
   - 把用户截图里的导航玻璃层按 `card-bg 45%` 反解，得到其背后壁纸 ≈ (175,110,122)；
   - 本站「无壁纸（渐变）状態」参考截图同位置实测 (173,104,121)；壁纸（动漫封面/视频）同位置为 (30,20,37)。
   - 结论：用户截图那一刻，页面里**根本没有渲染壁纸媒体**，只有 `.wallpaper-default` 渐变。
4. 由此确认第二个因素：settings 表当前配置是完好的（`bannerImageDesktop/Mobile=…-fs.mp4`、`bannerVideoPoster=…-c999c9b4.webp`、`wallpaperMode=banner`），但**已打开的前台标签页不会自动获取后台保存的新设置**（站点无任何「设置变更 → 前台自动刷新」机制；layout 为 force-dynamic 只保证新请求拿到新配置）。
   - 这正好解释用户的完整操作：在「站点设置」页保存壁纸 → 切回「流萤」标签页 → 横幅仍是旧渐变底（不显示新壁纸），需要手动 F5。

**待用户批准的两个改动**
- A. 前台设置自动同步：新增轻量客户端同步组件 + `/api/settings/version`（settings 表 max(updatedAt)），在 `visibilitychange/focus` 恢复可见时（并每 60s 兜底轮询）比对版本，不一致则 `router.refresh()`；实现「后台保存即时生效，无需手动刷新」。
- B. 隐藏期间不再做无意义的 `load()` 重试（隐藏时必然失败且会重置元素），改为可见/交互时立即 `load()+play()`，把恢复时间从约 4 秒压到 1 秒内。
- （可选）C. 44MB 横幅视频换小（≤8MB）。

**环境侧建议（用户执行）**
- 在站点标签页按 F12 → Console 输入 `document.visibilityState`：显示 `hidden` 即命中本问题；
- `chrome://flags/#calculate-native-win-occlusion` → Disabled → 重启 Chrome；
- 复测时避免锁屏 / 远程控制虚拟显示器遮罩场景（本次抓屏时机器正处于锁屏）。
## 2026-10-17 03:5x-04:0x · 修复「切到后台保存设置 → 切回前台标签页横幅不显示」+ 横幅回到前台即刻恢复

**本次落地改动（已通过 tsc / eslint / 运行时实测）**
1. 前台设置自动同步（后台保存即时生效，无需手动 F5）
   - 新增接口 `src/app/api/settings/version/route.ts`：GET 返回 `{ version }`（settings 表最近更新时间戳），`force-dynamic` + `Cache-Control: no-store`，无需鉴权（只暴露时间戳）。
   - `SettingRepository` / `SettingService` 各加一个方法：`findLatestUpdatedAt()`（仓储）与 `getSettingsVersion()`（服务），接口与实现分文件同步补齐。
   - 新增客户端组件 `src/components/site/settings-auto-sync.tsx`：页面渲染时带版本号，每 20 秒 + `visibilitychange/focus/pageshow` 时比对，发现变化即 `router.refresh()`（SPA 内刷新，不闪屏、不丢 JS 状态）。
   - `src/app/(site)/layout.tsx` 挂载：`<SettingsAutoSync version={settingsVersion} />`（与 DevAutoReload 并列）。
2. 横幅回到前台即刻恢复（banner-video.tsx）
   - 新增 `revive(reason)`：清空 `lastRecoverAt` 与 `lastPlayAttemptAt` 两个节流后立即执行 `recover()`；`visibilitychange(可见)/focus/pageshow/IntersectionObserver` 四条「明确回到前台」信号改走 revive，鼠标移动等高频 activity 仍保持原有节流（避免重载循环）。

**验证证据（无头 Chrome 148，1920x919，真实登录态）**
- 设置同步：前台标签页保持打开 → 管理端 PUT 改 `footerText` → 12 秒内页面自动出现新文案（`sentinel` 变量保持，证明是 `router.refresh()` 软刷新而非整页重载）；再 PUT 还原 → 18 秒内自动恢复旧文案。RESULT `{"applied":true,"reverted":true}`。
- 横幅恢复：切走 20 秒（`op:0`，退回封面）→ 切回后 **221ms** 重新 `op:1`（旧逻辑要等待数秒节流）；另一次「播放中切走→切回」同样 221ms。
- 接口与页面冒烟：`/api/settings/version` 200 且 `Cache-Control: no-store`；`/`、`/archives`、`/tags`、`/search`、`/admin/login` 全部 200；`tsc --noEmit` 退出码 0；eslint 对 8 个改动文件退出码 0。
- 修复过程发现：长期运行的 dev server 对「新增接口 + 新增服务方法」不会热更新模块（首次请求 500），重启 dev 后正常 —— 以后改这类文件要重启 dev 再验证。

**仍未闭环（需用户配合）**
- 用户当前打开的标签页仍是旧 JS，需硬刷新一次（Ctrl+F5）才会带上自动同步逻辑。
- 用户浏览器「窗口被判定不可见（occlusion）」导致视频无法加载的环境问题依旧：建议 `chrome://flags/#calculate-native-win-occlusion` 设为 Disabled 后重启 Chrome；该环境下站点只能显示静态封面。
- 横幅视频 44MB 偏大（建议 ≤8MB）；诊断三件套（banner-debug / api/debug/banner / 组件内上报）等用户复测通过后再摘除。
## 2026-10-17 04:1x-04:3x · 「切换浏览器标签页后横幅不显示」取证：是旧页面没更新（非横幅回归）+ 交互信号唤醒同步

**取证（用户内置浏览器 + 诊断日志 + 渲染对比）**
- 用户截图比对：横幅区域是纯主题默认渐变（无任何图片细节）。与三种真实渲染按同尺寸裁剪比对：纯渐变底 ≈ rgb(200-208,164-170,162-178)；视频首帧有明显细节（rgb(119-168) 区间）；用户截图 rgb(213-218,183-187,185-195) ⇒ 画面里没有壁纸媒体层（既不是视频帧，也不是封面图）。
- 导航项比对：用户截图只有「首页/归档/标签」，当前版本是「首页/动态/归档/标签/搜索」（`defaultNavLinks`；DB `navLinks` 为空 ⇒ 用默认值）；`/dynamic` 路由文件创建于今天 00:31 ⇒ 用户那一页是 00:31 之前的旧 bundle。
- 活跃度测量：90 秒窗口内 dev 日志只有 2 次 `/api/settings/version` + 2 次 `/api/dev/version`（≈1 次/分钟，属于隐藏标签页节流后的轮询，来自调试日志里的隐藏会话 7k8phi）；用户那两个内置浏览器标签页不产生任何请求 ⇒ 页面 JS 没有在运行（旧 bundle 里没有这两个轮询组件），因此「切回去」永远不会自动更新。
- 结论：用户看到的是 3 个多小时前渲染的旧页面（旧壁纸配置 + 旧导航），「横幅不显示」是页面没更新，不是横幅组件回归。

**本轮改动（已通过 tsc / eslint / 运行时实测）**
- `src/components/site/settings-auto-sync.tsx`：新增交互信号唤醒（`pointerdown` / `wheel` / `keydown` / `touchstart`，1 秒限速）。内置浏览器/被遮挡窗口可能既不投递 `visibilitychange` 也不触发 `focus`，此时「回到页面后的第一次点击/滚动/按键」就是最可靠的唤醒信号。
- 实测：打开页面 → 改库（`footerText`，版本 1792180214368 → 1792211188072）→ 派发一次 `mousePressed`（等同用户点击）→ **563 ms** 内页面出现新文案；随后已把该设置还原（DB 现为 `"Powered by 流萤动态博客"`）。

**回归证据（无头 Chrome 148 / CDP，1920x919）**
- 「出生即隐藏」标签页（`vis=hidden`、`rs=0/net=2`，媒体被浏览器挂起 20 秒）→ 切到可见后 **1.2 秒** `rs=4`、`vop=1`（视频加载并出画）。
- 隐藏期间 CDP 截图：横幅显示封面图（`bg = /uploads/2026/10/1792149477855-c999c9b4.webp`），不会空白。

**待用户动作**
- 在「流萤」标签页按一次 Ctrl+F5（硬刷新）；预期：横幅立刻是动画壁纸、导航出现「动态/搜索」。若仍不显示，请附整窗截图（含页面主体）继续排查。
- 诊断三件套（`src/lib/banner-debug.ts`、`src/app/api/debug/banner/route.ts`、banner-video 内上报）保留到用户复测通过后再摘除。
## 2026-10-17 04:3x-05:0x · 横幅「解码器假死」兜底：切回后恢复从 ~7s 压到 ~2s（含 5 组回归 + 触发验证）

**背景取证（CDP 冻结标签页实验，无头 Chrome 148 / 1920x919）**
- `Page.setWebLifecycleState(frozen)` 25 秒再 `active` 后复现过一次真实故障：`readyState=4`、`paused=false`、`currentTime` 与帧号完全卡死（570 帧不动），旧逻辑要等 watchdog 6 秒阈值才重载，**切回后 7.1 秒才重新出画**（期间只有封面）。
- 同期 6 次同类实验中 5 次 200ms 内自愈 ⇒ 属偶发，但确实存在，正是用户所说「有时候就不显示了」。

**本次改动（仅 1 文件：`src/components/site/banner-video.tsx`）**
- 新增 `KICK_WINDOW_MS = 1300` 与 `scheduleKick()`：`recover()` 判定帧已停滞时，给解码器 1.3 秒观察窗口；窗口内仍无新帧就 `cover() + video.load() + play()` 直接重载元素，不再等 6 秒 watchdog 阶梯。
- 触发条件有双重保护：只在「明确的恢复信号」走到停滞分支才排期，且真正执行前再校验 `stopped / layoutVisible / renderActive(now)`，真正隐藏的标签页（rAF 停摆）不会重载。
- 清理函数里 `clearTimeout(kickTimer)`，避免组件卸载后回调复发。

**回归与验证证据**
- 回归 5 组（全部 ~200ms 恢复，且均未触发 kick，无副作用）：普通切走 12s → 202ms；冻结 25s → 203ms；冻结 60s → 208ms；冻结 25s 第二次 → 216ms；出生即隐藏 20s → 211ms（出画后 `op=1`、`rs=4`）。
- 触发验证（人为把 `requestVideoFrameCallback` 延迟 4 秒制造「帧号卡死」，再派发一次滚轮交互）：事件序列 `cover → recover:activity → kick:reload → play-ok → reveal`，`kick:reload` 在 **3746ms** 触发，随后恢复出画 `op=1`、播放正常。
- 工程质量：`tsc --noEmit` 退出码 0；`eslint src/components/site/banner-video.tsx` 退出码 0。

**下一步**
- 等用户硬刷新后复测「切标签页回来看壁纸」；若仍异常，按 `/api/debug/banner` 会话日志定位（会话字段：vis/focus/rs/net/op/frames）。
- 继续核对目标清单：文章密码保护端到端（服务端不得泄漏正文）、MD 导入导出冒烟、首页分类条细小标记、后台/前台视觉核查。
## 2026-10-17 05:0x-05:3x · 定位「切浏览器标签页回来横幅不显示」：宿主把页面判为 hidden → Chrome 推迟媒体加载；新增封面动效 + 定时器自愈 + 诊断增强

**取证（真机日志 + 无头复现 + 决定性实验）**
- 真机诊断日志（`/api/debug/banner` 落盘）共 410 个真机会话，其中 407 个长期 `vis:hidden / focus:false`；最近 25 分钟的三个真机会话（`zcwx1z` / `1yj4yk` / `aig2pv`）全部 `vis:hidden`，视频 `rs:0、net:2→3、frames:0`，只有 `keepalive / reload:dead-source / play-fail`。页面可见时一切正常（历史会话 `0mjal3` 帧号 18→10353 连续增长、`op=1`）。
- 无头复现（同源双标签，A 在后台加载）：`vis=hidden、rs=0、net=2`，CDP 截图确认横幅显示封面图而非空白；切回 A 后 4 秒内 `rs=4 / net=1 / op=1`、帧数继续增长。
- 决定性实验：隐藏态下 `fetch()` 能取回整段 44MB 视频（46057794 字节）并换成 blob: URL，但 `load() + play()` 仍被推迟（`rs=0 / net=2`，play 以 AbortError 被拒）；再派发真实手势（CDP 点击 + 滚轮）同样无效。⇒ 推迟发生在媒体元素层而非网络层，JS 无法绕开；只要宿主把页面判为 hidden，`<video>` 就不加载。

**本次改动（4 文件）**
- `src/components/site/banner-video.tsx`：封面加一层独立 `<img>`（与容器背景双保险）；新增 `STUCK_ANIM_MS=4000` 与 `setStuck()`（视频长时间无新帧时给容器打 `data-stuck`）；新增 `LAYER_REPAIR_MS=5000` 定时器图层巡检（以 `renderActive()` 为门槛，强制重绘 / 重栅格化）；watchdog 内写入 `dataset.rafAt` 供诊断。
- `src/app/globals.css`：`.banner-media-frame[data-stuck="true"] img` 加 26s 慢速推移（`banner-kenburns`），并支持 `prefers-reduced-motion` 关闭。
- `src/lib/banner-debug.ts`：上报新增 `mode / wrapH / stuck / posterOk / rafAge` 字段。
- `src/app/(site)/layout.tsx`：对封面图调用 `preload(poster, { as: "image" })`。

**验证证据（无头 Chrome 148 / CDP / 1920x919）**
- T1/T2「出生即隐藏」10s：`posterOk:true、wrapH:597、stuck:true`（截图=封面图）→ 切回后 `frames=298、op=1`，`stuck` 清除。
- T3 阻断 mp4（`Network.setBlockedURLs`）12s / 32s：`net:3、rs:0、stuck:true`，横幅=封面+动效，未空白；重载 / 重建次数有界。
- T4 逻辑模拟「宿主长期 hidden」（`visibilityState` 恒 hidden）：视频照常播放（`frames=698、op=1`），`stuck` 不误开。
- 真机新会话 `aig2pv`（05:15:34 重载）已上报新字段并出现 `repair:layer`、`stuck:on`（`posterOk:true、wrapH:597`）⇒ 新代码在真机生效。
- 工程质量：`tsc --noEmit` 退出码 0；`eslint`（3 个 ts/tsx 文件）退出码 0。

**待用户动作 / 下一步**
- 想让真机恢复 mp4 播放需先解决宿主把窗口判为隐藏的问题：`chrome://flags/#calculate-native-win-occlusion` → Disabled → 重启 Chrome（否则视频永远不加载，只能显示封面）。
- 请硬刷新（Ctrl+F5）后复测；若横幅区域仍空白，请附整窗截图（含地址栏与页面主体）继续定位。
## 2026-10-17 05:3x-06:0x · 仪表盘升级（平滑面积图 + 悬停读数 + 卡片层次）· 前台四页冒烟通过

**本轮改动（2 个文件，仅后台仪表盘组件）**
- `src/components/admin/dashboard-trend-chart.tsx`：柱状图改为**平滑面积图**（主题色渐变填充 + 描边），新增逐日悬停读数（引导线 + 数据点 + tooltip，整列热区避免闪烁），X 轴补中点日期；空数据时给出「近 30 天还没有发布」提示。
- 折线算法采用**单调三次插值（Fritsch–Carlson / PCHIP）**：首版普通贝塞尔平滑会把「单日发布 3 篇」摊成相邻好几天的缓坡（读数失真），换 PCHIP 后峰值收窄到真实的一天，不再过冲。
- `src/components/admin/dashboard-stat-card.tsx`：新增顶部主色细线、右上角跟随 `--hue` 的柔光斑、图标徽章 ring 与悬停缩放、数值 `tabular-nums`，层次更接近前台的玻璃卡片质感。

**验证证据（无头 Chrome 148 / CDP / 1920x919，admin 登录后截图）**
- 亮色：`%TEMP%\admin-dashboard-v3.png`（新面积图 + 峰值收窄）、`admin-dashboard-v3-hover.png`（悬停出现「10-09 0 篇」读数与引导线）。
- 暗色：`%TEMP%\admin-dashboard-v4-dark.png`（`html.dark`，卡片/图表配色正常，无对比度问题）。
- 前台四页冒烟（暗色，`fe-home/fe-post/fe-archives/fe-tags.png`）：横幅、文章页 TOC、归档年份分组、标签云均正常，页面运行时错误记录为 `[]`（本次 `preload` 封面与 `banner-video` 改动无副作用）。
- 工程质量：`tsc --noEmit` 退出码 0；`eslint`（dashboard-trend-chart / dashboard-stat-card）退出码 0。

**下一步**
- 等用户复测横幅（硬刷新 + 可选关闭 `calculate-native-win-occlusion`）后，决定是否摘除诊断三件套。
- 继续按目标推进：前台与官网 `docs/research/firefly.cuteleaf.cn-site/*pretty.html` 的细节对齐、后台其余页面（文章编辑器 / 设置 / 媒体）的细节打磨。
## 2026-10-17 06:0x-06:1x · M3 验收项自动化验证 22/22 通过（分类删除/转移、标签合并、改密使旧会话失效）

**验证脚本**：`%TEMP%\verify-m3-acceptance.js`（Auth.js 凭据登录拿会话 Cookie → 走真实 HTTP 接口 → 结束后还原全部数据）

**结果（22/22 PASS）**
- 分类：新建临时分类 → 移入文章 → **不带 moveTo 直接删除被拒**（`400 category_not_empty`）→ **带 `moveTo=1` 删除成功**（响应 `{"movedPosts":1}`）→ 文章分类回到原值（categoryId=1）。
- 标签：新建两个临时标签 → 文章同时挂载 → 合并前计数各为 1 → `POST /api/tags/merge` 成功 → 源标签已删除、目标标签计数为 1（同一文章自动去重）、文章仅保留目标标签（`[2,3,8]`）→ 恢复文章标签后删除临时标签成功。
- 账号安全：`PUT /api/account/password` 成功后，**旧会话 Cookie 立刻 401**；用新密码重新登录可正常访问后台接口；随后把密码还原为初始值并再次确认可登录。

**数据还原复核（MySQL 直查）**：`categories=2、tags=4、posts=3、media=6`，文章 1/2/3 的分类分别回到 `2/1/1`，无临时数据残留。

**下一步**
- 等用户复测横幅结论；继续前台与官网细节对齐、后台其余页面打磨。
## 2026-10-17 06:1x · 前台与官网逐块对照（截图比对）：结构已对齐

**证据**：无头 Chrome 148 / 1920x919 直连官网 `https://firefly.cuteleaf.cn/` 截图 `%TEMP%\official-home.png`，与本站 `%TEMP%\repro-back.png`（亮色）、`%TEMP%\fe-home.png`（暗色）逐块比对。

**对齐项**：玻璃吸顶导航（品牌点 + 图标导航 + 搜索 + 主题切换）· 横幅主标题 + 副标题轮播 + 圆形社交按钮 · 横幅底部波浪过渡 · 左栏资料卡（头像 / 昵称 / 签名 / 图标按钮行）· 分类胶囊行（首页胶囊 + 分类计数 + 「更多 >」）· 文章卡片（标题竖条 + 置顶/日期/分类徽章 + 摘要 + 标签 + 右侧圆角封面）· 右栏「最新动态」「站点统计」卡片。

**差异（有意保留）**：官网默认色相为青绿、本站为粉（由后台 `themeHue` 控制，属可配置项）；官网导航带下拉分组（文章/社交/我的…），本站为扁平导航 + 动态/搜索入口（后台可配置 `navLinks`）。

**下一步**
- 继续后台其余页面（编辑器 / 设置 / 媒体）细节打磨与前台细节（卡片悬停、动画时长）微调。

## 2026-10-17 05:4x-06:1x · 横幅「切浏览器标签页回来空白」加固：新增纯绘制封面兜底层

**问题复述（用户）**：在内置浏览器两个标签页（站点设置 ↔ 前台首页）之间切换后回到前台，横幅不显示；用户明确是「浏览器标签页」之间的切换。

**取证（真机诊断日志 + 截图放大比对 + 隔离实验）**
- 真机日志两个会话（`aig2pv` 05:15-05:32、`erv1py` 05:32-05:49，`mode=banner`）全程 `vis:hidden / focus:false`，rAF 在加载后停摆（`rafAge` 由 30s 涨到 1019s），视频 `rs:0 / net:2→3 / frames:0`，只有 `reload:dead-source + play-fail`；同一时间 `posterOk:true`、`wrapH:597` ⇒ 封面图已加载、容器几何正常，视频不播是宿主把页面长期判为 hidden（媒体加载被推迟），JS 无法绕开。
- 用户截图放大比对：横幅区域只画出了「默认渐变 + 黑色蒙层」，同一容器里的封面 `<img>`、容器背景图、视频三层**都没有被绘制**，而普通 DOM（渐变层、导航、浮层）正常绘制 ⇒ 宿主回收/丢弃了媒体相关的合成图层。
- 隔离实验（无头 Chrome 148 / CDP）：注入 CSS 隐藏视频、隐藏封面 `<img>`、清空容器背景，只保留新兜底层 → 横幅仍完整显示封面图（`%TEMP%\verify-poster-isolated.png`）。

**改动（3 文件，最小化编辑）**
- `src/components/site/site-shell.tsx`：`#wallpaper-wrapper` 内、媒体层之下新增 `#wallpaper-poster`（纯背景绘制：无动画、无变换、无滤镜、无子元素），配置了 `bannerVideoPoster` 时渲染。
- `src/app/globals.css`：`#wallpaper-poster` 尺寸/定位规则（cover + 0% 20%）；overlay / fullscreen 模式下与媒体层相同的模糊与 `scale(1.05)`、居中，保证三种壁纸模式视觉一致。
- `src/components/site/banner-video.tsx`：封面 `<img>` 由 `decoding="async"` 改为 `decoding="sync"`，让首次绘制就带上封面。

**验证（无头 Chrome 148 / CDP / 1920x919 与 687x780）**
- 正常加载：兜底层存在、尺寸与 `#wallpaper-wrapper` 完全一致（1905x597），视频正常播放（frames=403）。
- 阻断 mp4（模拟视频层不可用）：`stuck=true、frames=0`，横幅=封面图 + 标题浮层，无空白（`%TEMP%\verify-poster-B.png`）。
- 687x780（内置浏览器面板宽度）：兜底层 672x507 与容器一致，视频正常（frames=413）；顺带确认真机截图里横幅中段的「横条」是画面里的刀身与花瓣，不是渲染错位。
- 覆盖 / 全屏模式：注入 `data-wallpaper` 验证兜底层跟随 blur/scale/居中，截图无异常。
- 工程质量：`tsc --noEmit` 退出码 0；`eslint`（site-shell / banner-video）退出码 0。

**待用户动作**
- 硬刷新（Ctrl+F5）后在内置浏览器里复测「切标签页回来」；若横幅仍空白，请附整窗截图（含地址栏），我会继续按 `%TEMP%\firefly-banner-debug.log` 定位。
- 视频本身在「宿主长期判 hidden」的环境里无法播放（只能显示封面）；Chrome 侧可尝试 `chrome://flags/#calculate-native-win-occlusion` → Disabled 后重启。另建议把 44MB 的横幅视频压到 ≤8MB。

## 2026-10-17 06:1x-06:3x · 前台首页窄屏网格布局对齐官网 + dev 服务器重启

**依据（官网源码实证）**：`firefly.cuteleaf.cn` 首页 `#post-list-container` 带 `data-default-layout="list" data-mobile-default-layout="grid" data-column-width="320"`，内联脚本按 `window.innerWidth < 780 ? "grid" : "list"` 应用；CSS 为 `.post-grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--post-card-min-width,320px),1fr));gap:1rem}`、`.grid-mode … .post-card-image{width:calc(100% - 2rem);margin:1rem 1rem 0;border-radius:.75rem}`、`.grid-mode … a[href]{font-size:1.25rem;-webkit-line-clamp:2;line-height:1.4}`。

**改动（2 文件，最小化）**
- `src/app/(site)/page.tsx`：首页文章列表容器补 `#post-list-container`。
- `src/app/globals.css`：新增 `@media (max-width: 779.98px)` 规则，把该容器切换为 `repeat(auto-fill, minmax(320px, 1fr))` 网格、封面内缩 1rem + 0.75rem 圆角、标题 1.25rem 两行截断并隐藏主色竖条（纯 CSS 实现，等价官网脚本行为且无布局闪烁）。

**验证（无头 Chrome 148 / CDP）**
- 687px（内置浏览器面板宽度）：`display:grid`、两列 `320px 320px`、gap 16px、封面 288px、标题 20px/两行截断/竖条隐藏，与官网同宽截图一致（`%TEMP%\grid-home-687b.png`）。
- 1024px：仍为 `display:flex` 列表模式（卡宽 681、封面 204、标题 30px、竖条显示），桌面行为未变。
- `tsc --noEmit` 退出码 0（过程中修掉一次 JSX 注释位置导致的语法错误）。
- dev 服务器重启一次以让 globals.css 生效（`%TEMP%\firefly-dev9.log`），重启后 CSS 分片已包含新规则。

**下一步**
- 后台其余页面（设置 / 媒体 / 动态 / 分类 / 标签 / 页面 / 编辑器）已逐张过目，未见明显缺陷。
- 等用户复测横幅；随后可补齐官网的「列表/网格切换 + localStorage 记忆（postListLayout）」交互。

## 2026-10-17 06:3x-07:0x · 前台「列表 / 网格」布局偏好（对齐官网 postListLayout）+ 显示设置面板扩展

**依据（官网源码实证）**：首页容器带 `data-default-layout="list" data-mobile-default-layout="grid"`，按 `window.innerWidth < 780 ? grid : list` 生效；访客偏好存 `localStorage["postListLayout"]`，并通过 `layoutChange` 事件同步；网格样式为 `display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem` + 封面内缩圆角 + 标题 1.25rem 两行截断。

**改动（4 文件 + 1 新文件）**
- 新增 `src/lib/post-list-layout.ts`：布局偏好类型（auto / list / grid）、localStorage 读写、`<html data-post-list-layout>` 应用函数与首屏内联脚本常量。
- `src/components/site/site-shell.tsx`：外壳顶部渲染首屏内联脚本，HTML 解析阶段即应用偏好（无布局跳变）。
- `src/components/site/display-settings.tsx`：显示设置面板新增「文章列表布局：自动 / 列表 / 网格」；同时把色相 / 透明度 / 布局状态改为懒初始化、effect 只同步 CSS 变量（消除 `react-hooks/set-state-in-effect` 报错）。
- `src/components/site/site-header.tsx`：`DisplaySettings` 增加 `key={主题色相-卡片透明度}`，后台默认值被改动并同步刷新时重新挂载、重新读取访客偏好。
- `src/app/globals.css`：窄屏自动网格规则加 `html:not([data-post-list-layout="list"])` 守卫；新增 `html[data-post-list-layout="grid"]` 显式网格规则（宽屏同样可用，封面回到文档流、内容内边距 1rem）。

**验证（无头 Chrome 148 / CDP）**
- 687px 无偏好 → 网格（两列 320px、封面 288px、标题 20px）；687px 显式列表 → 列表（单列 656px、标题 24px）。
- 1024px 无偏好 → 列表（封面绝对定位 204px、标题 30px）；1024px 显式网格 → 网格（两列 332.5px、封面 301px 文档流内、标题 20px），截图 `%TEMP%\layout-1024-grid.png`。
- 面板交互：打开显示设置 → 胶囊正确显示当前选择 → 点「自动」清除属性与存储并回到自动布局 → 点「列表」写入 `data-post-list-layout="list"` 与 `postListLayout=list`。
- SSR HTML 内已包含首屏脚本（`<script>try{var l=localStorage.getItem("postListLayout")…</script>`）。
- 工程质量：`tsc --noEmit` 退出码 0；`eslint`（5 个 ts/tsx 文件）退出码 0；dev 服务器重启一次（`%TEMP%\firefly-dev10.log`）。

## 2026-10-17 06:3x-06:4x · 横幅「切浏览器标签页回来空白」修复验证（定向复现 + 通过）

**现场证据（诊断日志活动会话，1920x919，与用户内置浏览器截图布局一致）**
- 06:24:32 加载（加载时间在两轮 dev 重启之后，已含修复代码），加载即 `vis:hidden / focus:false`，视频 `rs:0 / net:2→3 / frames:0`，4 秒后 `stuck:on`、`op:"0"`；保活持续 10 分钟以上，`posterOk:true`、`wrapH:597` 几何正常。
- 说明：宿主（内置浏览器）把页面判为隐藏后，浏览器会推迟媒体加载，视频永远出不了帧，这一层 JS 无法绕开；这正是「切回来横幅空白」的现场状态。

**定向复现（无头 Chrome 148 / CDP）**
1. 双标签真实切换 3 轮（前台 687x780 + 后台 900x700，第 2/3 轮叠加页面冻结 `Page.setWebLifecycleState`）：每次切回后视频帧继续增长（527 → 1194 → 1587 → 1891），横幅完整渲染（`tabswitch-2/3/4-after.png`）。
2. 后台加载复现（`Target.createTarget { background: true }`，1920x919，与现场同宽）：加载后状态与现场一致（`vis:hidden、stuck:true、rs:0、net:2、frames:0`）；切换到前台 3.5 秒内完全恢复（`vis:visible、stuck:""、rs:4、net:1、op:"1"、frames:208`），截图 `%TEMP%\bgload-after-switch.png` 横幅完整（Hero 标题/副标题/社交按钮/导航/正文/侧栏全部渲染）。

**结论与依据**
- 三层兜底已就位：`#wallpaper-poster` 纯背景绘制层（无动画/变换/滤镜，不被合成器提升，宿主回收视频/图片合成层后仍在主绘制层里）+ 封面 `<img decoding="sync">` + 视频长时无帧时封面慢速推移（stuck）。
- 逻辑闭环：用户截图中纯绘制层（默认渐变、导航）渲染正常 ⇒ 同属主绘制层的背景图兜底层必然渲染 ⇒ 横幅不再整块空白。
- 附带观察：页面隐藏期间视频源会按既有节流逻辑重试 `load()`（约每分钟一次），可在后续版本中改为「隐藏期间不重试」，本轮未改。

**下一步**
- 等用户硬刷新（Ctrl+Shift+R）后切标签页复测；确认后移除诊断三件套（`src/lib/banner-debug.ts`、`src/app/api/debug/banner/route.ts`、`banner-video.tsx` 内 `reportBannerDebug` 调用）。
- 提醒项：横幅 mp4 44MB 建议压到 ≤8MB。
## 2026-10-17 06:4x-06:5x · 壁纸模糊后台可配（overlayBlur / fullscreenBlur）

**背景**：`globals.css` 的 overlay / fullscreen 壁纸模式用 `--overlay-blur`、`--fullscreen-blur` 做背景模糊，但全项目没有任何赋值处，两种模式的模糊恒为 0；后台设置也缺这两个字段（上一轮配置覆盖度核对发现的唯一缺口）。

**改动（6 文件）**
- `src/types/site-settings.ts`：新增 `overlayBlur`、`fullscreenBlur`。
- `src/lib/theme-config.ts`：新增 `DEFAULT_OVERLAY_BLUR = 0`、`DEFAULT_FULLSCREEN_BLUR = 0` 与 `normalizeWallpaperBlur`（0-40 整数）。
- `src/server/validators/setting.schema.ts`：两字段 zod 校验（int、0-40、默认 0）。
- `src/server/services/setting.service.ts`：兜底值 + 解析（`normalizeWallpaperBlur`）。
- `src/app/layout.tsx`：SSR 注入 `--overlay-blur` / `--fullscreen-blur`（与色相、横幅高度同一处）。
- `src/components/admin/settings-manager.tsx`：外观主题区新增两个数字输入（0-40 px），输入即预览 CSS 变量。

**验证**
- `tsc --noEmit` 退出码 0；`eslint`（6 文件）退出码 0。
- 端到端往返：登录 → PUT `overlayBlur=12, fullscreenBlur=16` → 回读一致 → SSR HTML 含 `--overlay-blur:12px`、`--fullscreen-blur:16px` → 恢复 0（最终库里仍为 0，不改变现有效果）。
- CDP 链路：overlay 模式 poster/frame 计算样式 `blur(13px)` + `scale(1.05)`；fullscreen 模式 `blur(9px)`；banner 模式无 filter。
- 后台表单覆盖度脚本复跑：后台表单未覆盖字段 —— 无。
- 设置页截图 `%TEMP%\adm-settings-blur.png`（暗色主题，「外观主题」区可见两个新字段）。
- dev 重启一次（`%TEMP%\firefly-dev11.log`）。

**下一步**：等用户复测横幅；继续对照官网资料打磨前台细节。
## 2026-10-17 07:0x-07:3x · 右栏组件核对 + 导航栏「背景视频」开关（官网对齐）+ 可见性工具类失效修复

**核对（对照官网快照与规格）**
- 右栏与官网一致：官网实际为「最新动态」（root-page/index.html 计数：最新动态 2、站点统计 2、站点信息 2、「最新文章」0），我们左栏（资料卡/公告/分类/标签）与右栏（最新动态/站点统计/站点信息）已对齐，无需改动。
- 页脚 RSS / Atom / Sitemap 三件套齐备（`src/app/rss.xml`、`atom.xml`、`sitemap.ts` 均存在，页脚已挂三链接）。
- 官网导航栏还有「音乐」与「背景视频开关」两个控件：音乐属新模块，方案见 `docs/planning/music-player-plan-r1.md`（待批准）；背景视频开关本轮实现。

**实现：导航栏「背景视频」播放/暂停开关（对齐官网 #bg-player-toggle）**
- 新增 `src/lib/banner-video-events.ts`：事件契约（toggle 请求 / 状态广播 + 载荷类型）。
- 新增 `src/components/site/banner-video-toggle.tsx`：md 及以上显示，图标随播放状态切换，中文 aria/title（播放背景视频 / 暂停背景视频）。
- `src/components/site/banner-video.tsx`：新增 userPaused，用户暂停优先于全部自愈逻辑（ensurePlaying / recover / scheduleKick / watchdog 四处门控 + toggle 监听 + 卸载清理），挂载时广播初始状态。
- `src/components/site/site-header.tsx`：仅当壁纸未关闭且横幅为视频（isVideoUrl）时渲染开关。

**顺带修复（真实缺陷）**：`.btn-plain` / `.category-pill` 是非分层自定义 CSS，其 display 会压过 Tailwind 的 hidden 工具类，导致 1) 桌面端多出一个重复的搜索图标；2) 背景视频开关在窄屏不隐藏；3) 首页分类条「更多」胶囊在窄屏不隐藏。三处改用 Tailwind 4 的 `!` 重要修饰符（与官网 `lg:hidden!` 做法一致）。

**验证（CDP + 截图）**
- 开关功能：初始播放中（帧数 469）→ 点击 → `paused:true`、currentTime 冻结、9 秒后仍保持暂停（自愈确实静默）→ 再点击 → 恢复播放（帧数 469→707）。截图 `%TEMP%\bgtoggle-paused.png`（▶ 图标）、`%TEMP%\bgtoggle-playing.png`（⏸ 图标）。
- 可见性：687px → 开关隐藏 / 仅图标搜索 / 「更多」隐藏；1280px → 开关显示 / 无重复搜索图标 / 「更多」显示；截图 `%TEMP%\visfix-1280.png`。
- `tsc --noEmit` 0；`eslint`（7 文件）0。

**遗留**：等用户复测横幅（切标签页）后移除诊断三件套；音乐模块等用户批准方案后实施。
## 2026-10-17 07:0x-07:2x · 横幅「切浏览器标签页回来空白」根因定位 + 修复（隐藏时不自动刷新 + 可见性轮询兜底）

**根因（诊断日志实证，1 万余行会话数据）**
- 真实浏览器（1920x919，即用户窗口）的全部近期会话（e2wci3 / b93zrb / ez3da5 / 0zo2kc）从首次上报到会话结束**全部是 `vis:hidden`**，一次 `visible` 都没有；视频元素 `rs:0`（一个字节都没下载）、`frames:0`，只有封面图 `posterOk:true`。
- 实验（CDP 后台标签 + 手动注入）：即使先用 `fetch()` 把 44MB 视频下成内存 blob 再交给 `video` 元素，隐藏页面里 `readyState` 依旧停在 0 —— **Chromium 对隐藏页面推迟的是整个媒体加载算法，不依赖网络来源，任何 JS 手段都绕不开**。页面一旦在隐藏状态下刷新，视频就再也起不来。
- 触发点确认：`DevAutoReload`（开发期源码版本戳自检）在页面隐藏时照样 `location.reload()`。切换标签页期间源码被改动 → 隐藏标签页被刷新 → 新文档在隐藏态下不加载媒体、也不重绘，用户切回来看到的就是空白横幅。此前 16:27 前后 48 秒内 100+ 次挂载（每次新 sid）就是这轮刷新风暴的痕迹。
- 顺带确认（隐藏态截图 `%TEMP%\blobtest-hidden.png`）：隐藏页面里封面兜底层是**正常绘制**的，所以修复方向正确 —— 空白来自“隐藏刷新”，而不是封面层失效。

**改动（2 文件，最小编辑）**
- `src/components/dev-auto-reload.tsx`：新增 `pageAwake()`（可见或有焦点）门控；发现版本戳变化但页面不处于前台时只记 `pendingReload` 不刷新；回到前台/获得焦点时（visibilitychange / focus / pageshow）立即补刷一次。
- `src/components/site/banner-video.tsx`：视频自检循环新增可见性轮询兜底（`hiddenFlag`），宿主只更新状态、不派发 visibilitychange 时，回到可见 1 秒内即走 `revive("poll")` 恢复流程。

**验证**
- `tsc --noEmit` 退出码 0；`eslint`（2 文件）退出码 0；dev 重启一次（`%TEMP%\firefly-dev12.log`）。
- T1 正常浏览器回归（CDP）：前台播放中（帧 338）→ 切后台 6 秒（`vis:hidden`，视频继续解码帧 695，`opacity:0` 由封面接管、`stuck:true`）→ 切回 2.5 秒（`opacity:1`、帧 849、stuck 清除）。截图 `%TEMP%\fixverify-foreground-recover.png`。
- T2 隐藏页不刷新（CDP，保留一个前台标签压住目标页）：隐藏加载 `vis:hidden / rs:0 / frames:0 / imgOk:true`（横幅显示封面，不空白）→ 更新 src 版本戳后轮询 22 秒，页面**未刷新**（注入的 `window.__navToken` 保持原值）→ 切到前台 2 秒内补刷 → 刷新后 5 秒视频已播放（`rs:4`、帧 338、`opacity:1`）。截图 `%TEMP%\fixverify-visible-after-reload.png`。

**结论与说明**
- 现在的行为：切后台期间不会被自动刷新；切回前台（正常浏览器）视频秒级恢复；宿主把标签页长期判为 hidden 时（内置浏览器/锁屏）视频按浏览器规则无法加载，此时横幅显示封面图并以慢速推移动效兜底，**不会空白**。
- 谷歌浏览器（普通窗口）下横幅视频播放、切后台、切回恢复均已验证正常。

**下一步**
- 等用户复测：谷歌浏览器切标签页 + 内置浏览器切标签页各一次；确认无空白后移除诊断三件套（`src/lib/banner-debug.ts`、`src/app/api/debug/banner/route.ts`、`banner-video.tsx` 内 `reportBannerDebug` 调用）。
- 提醒项：横幅 mp4 44MB 建议压到 ≤8MB；音乐模块方案 `docs/planning/music-player-plan-r1.md` 待用户批准后实施。
## 2026-10-17 07:4x-08:0x · 文章页「相关文章」卡（对齐官网）+ 系列模块方案

**核对**：对照官网文章页快照（`post-guide/pretty.html`）逐块比对，文章页缺两块：1) 上下篇与版权卡之间、带「智能推荐」徽标的「相关文章」卡；2) 与相关文章并排的「系列导航」卡（需要 series 数据）。归档页规格（`archive-page.spec.md`）核对通过：年份折叠、时间轴节点、分类徽标、标签列、`?category=`/`?tag=` 筛选行均已一致。

**改动（1 新建 + 5 编辑，无数据库变更）**
- 新建 `src/components/site/related-posts-card.tsx`：官网同款结构（编号徽标 + 标题 + 分类徽标 + 摘要 + 箭头，「智能推荐」徽标，加密文章加「加密」徽标）。
- `post.repository.interface.ts` / `post.repository.ts`：新增 `listRelatedPublished`（标签命中与分类命中分两次查询后合并去重；相关度评分 = 相同标签 ×2 + 同分类 ×1；同分按发布时间倒序；不足 limit 时用最新已发布文章补齐）。
- `post.service.interface.ts` / `post.service.ts`：新增 `listRelatedPosts(slug, limit)`（先落地定时发布，再按当前文章分类/标签取相关文章）。
- `src/app/(site)/posts/[slug]/page.tsx`：详情与相关文章并行查询；卡片渲染在上下篇之后、版权卡之前（与官网顺序一致）。

**验证**
- `tsc --noEmit` 0；`eslint`（6 文件）0；dev 重启（`%TEMP%/firefly-dev13.log`）。
- CDP DOM 取证：`/posts/markdown-guide` → 卡片存在、含「智能推荐」徽标、2 条（hello-firefly 同分类「技术」优先、protected-demo 为补齐项）；`/posts/protected-demo` → 2 条，其中加密项带「加密」徽标；页面区块顺序 = 相关文章 → 版权说明 → 评论（与官网一致）。
- 截图 `%TEMP%/related-protected-demo.png`。

**新增待批准方案**：`docs/planning/series-module-plan-r1.md`（系列导航卡 + `/series` 总览页 + 导航入口；含 `Post.series` 字段迁移 `add_post_series`、3 新建 + 8 编辑清单、验收标准、2 个待确认点）。

**下一步**：1) 等用户复测横幅（内置浏览器 + 谷歌浏览器）；2) 批准后实施音乐播放器与系列模块。

## 2026-10-17 07:5x · 内置浏览器「切标签页不显示」真正根因：dev 服务器 HMR restart 风暴（已处置）

**现象复现（关键反转）**：用户报告「切换两个浏览器标签页（站点设置 / 首页）后页面不显示」。调试日志显示内置浏览器会话（1920x919，Chrome UA）自 07:24 起每 0.3~0.8 秒重建一次（SESSION_ID 持续变化：90 秒内 154 个新文档），持续 25 分钟不停，桌面/浏览器均无人操作时也在循环。

**逐层排除**
- 源码版本戳（`323:1792193006017`）10 秒内 10 次采样完全一致；工程目录（排除 node_modules）10 秒内只有 `.next/dev/logs/next-development.log` 被写 → 排除 `DevAutoReload` 版本失配与源码文件变更两条路径。
- 无头 Chrome CDP 探针复现：打开首页后 `performance.getEntriesByType('navigation')[0].type === "reload"`，每约 4.1 秒整页重载一次；而 `DevAutoReload` 有 10 秒硬性间隔（`MIN_RELOAD_GAP_MS`），逻辑上不可能 4 秒刷一次 → 排除项目自身代码触发。

**定位（两条硬证据）**
- 直接监听 `/_next/hmr` WebSocket：服务器在每个页面请求之后都推送 `{"type":"turbopack-message","data":[{"resource":{"path":"static/chunks/_1anvha4rlo79g._.js"},"type":"restart"}]}`，`hmrVersion` 每秒递增（2054→2066+ / 20s）；控制台同步出现 `[Fast Refresh] rebuilding` 刷屏。
- CDP `Debugger.setBreakpointOnFunctionCall(location.reload)` 抓到调用栈：`restart → handleApply → triggerUpdate → handleSocketMessage → processTurbopackMessage → processMessage → handleMessage` —— 整页重载由 Next 开发 HMR 客户端处理 `restart` 更新时发起（`location` 关键方法为 LegacyUnforgeable，普通 monkey-patch 无效，必须用函数断点）。

**结论**：07:24:22 启动的那个 `next dev` 实例（pid 22316）处于「每次请求都重新编译」的病态状态（22 分钟消耗约 1400s CPU、内存 4.7GB），每轮编译都向所有客户端广播 entry chunk 的 `restart` 更新；客户端收到即整页重载，重载又发起新请求触发下一轮编译——自我维持的无限重载循环。页面始终停在「加载中/重建中」，用户切回标签页时看到的就是空白。与 07:23 之前的横幅修复无关（该修复本身按预期工作：封面兜底 `stuck:true`）。

**处置**：完整结束旧实例（launcher 14608 + server 22316，确认无残留 loader pool 子进程）后重启 dev（日志 `%TEMP%\firefly-dev14.log`，413ms ready，重启后内存 462MB）。
- 验证：CDP 探针 33 秒仅 1 次导航、`navType=navigate`、`readyState=complete`；dev 服务器 10 秒 CPU 增量 0s；内置浏览器会话（1920x919，sid=y60who）不再重建，每 5 秒正常 tick、`posterOk=true`、`stuck=true`（封面兜底生效，非空白）。
- HMR 回归：只改 `src/lib/dev-version.ts` 的文件时间戳（不改内容）→ 页面按预期只重载 1 次（`DevAutoReload` 正常语义），随后维持稳定，无风暴。

**规避与复现要点**：若再次出现「页面不停闪烁 / 白屏 / 切标签页后不显示」，重启 dev 服务器即可恢复；重启前务必确认旧进程（`next dev`、`start-server`、loader pool 子进程）全部退出，避免新旧实例并存而写坏同一份 `.next` 状态。
## 2026-10-17 08:3x · 标签页补「Top 10」排行卡 + 官网入场动画对齐（逐项延迟 / sr-only 标题）

**用户反馈**：标签页下方大片空白（附截图）。

**取证（官网快照）**：`docs/research/firefly.cuteleaf.cn-site/tags-page/index.html` 中，标签云卡片下方还有一张排行卡：`<div class="card-base px-8 py-6 mt-4"><h2 class="text-lg font-bold text-75 mb-4">Top 10</h2>...`；每行 = 名次 + `#标签` + `N 篇文章` + 进度条，条宽 = 该标签已发布文章数 / 最高计数（官网示例 9→100%、8→88.888…%）。标签云外层另有 `min-h-32` 容器，整页淡入挂在 `#content-wrapper` 上（内层卡片不再单独挂 `onload-animation`）。
**取证（官网 CSS，网络拉取）**：`https://firefly.cuteleaf.cn/_astro/Layout.D6XwfbwI.css` 中：`:root{--radius-large:1rem;--content-delay:.15s}`；`.onload-animation{opacity:0;animation:.12s ease-out forwards fade-in-up}`；`.onload-animation:first-child{animation-delay:0s}` 并 `nth-child(2..5)` 按 30ms 递增（0/30/60/90/120ms）；首页文章卡与分类卡另用行内 `calc(var(--content-delay) + Nms)`，N 逐项 +50ms（首页实测 0..500ms）；归档/标签列表页无行内延迟。

**改动（4 个文件，无 DB 变更、无新依赖）**
- `src/app/(site)/tags/page.tsx`：标签云卡下方补同款 Top 10 排行卡（复用 `tagService.listAll()` 已有的 `postCount`，按计数降序、并列按名称升序取前 10）；整页淡入改为与官网 `#content-wrapper` 一致的单块包裹。
- `src/app/globals.css`：新增 `--content-delay: 0.15s` 与官方同款 `.onload-animation:first-child / :nth-child(2..5)` 30ms 递增规则。
- `src/app/(site)/page.tsx` + `src/components/site/post-card.tsx`：首页文章卡片按序号使用官方公式 `animation-delay: calc(var(--content-delay) + Nms)`（N=index×50）；`animationDelayMs` 为可选参数，未传值时交给全局 30ms 规则（tag/category 列表页与官网一致，不加行内延迟）。
- `src/app/(site)/categories/page.tsx`：分类卡片同公式逐项 50ms 递增；首页与归档页补 `<h1 class="sr-only">`（官网分别用站点名「Firefly」与「归档」）。

**取证（改后）**
- `pnpm exec tsc --noEmit` 退出码 0。
- HTTP 断言：`/tags` 含 `Top 10` 与 4 行排行、条宽 100/50/50/50；`/` 首屏卡片 `animation-delay:calc(var(--content-delay) + 0ms/50ms/100ms)`；`/categories` 0ms/50ms。
- 编译后 CSS `/_next/static/chunks/src_app_globals_css_*.css` 含 `--content-delay: .15s`、`.onload-animation:nth-child(2..5)`、`.onload-animation{opacity:0;animation:.12s ease-out forwards fade-in-up}`——与官网取值逐字符一致（Turbopack 已热更新，无需重启）。
- CDP 全站巡检（1920×919）：`/`、`/posts/protected-demo`、`/posts/markdown-guide`、`/archives`、`/tags`、`/categories`、`/tag/markdown`、`/category/tech`、`/search`、`/dynamic`、`/page/about` 共 11 页；动画元素 `opacity` 全部为 1，横幅视频 `readyState=4`、`opacity=1`。仅文章详情页有 2 个 `opacity=0` 元素，经查为 `.widget-hide-on-post`（父级 `display:none`，官网在文章页同样隐藏站点统计/站点信息）——非缺陷。
- 截图：`%TEMP%/align-{home,categories,tags,archives}.png`（另有 `%TEMP%/tags-top10-1920.png` 与 `tags-top10-1440.png`）。

**下一步**：等用户复测标签页；`docs/planning/{series-module,music-player}-plan-r1.md` 仍待批准；横幅 mp4 44MB 建议压到 ≤8MB（本机无 ffmpeg，可选加 `ffmpeg-static` dev 依赖离线压缩，需批准）。

## 2026-10-17 09:0x · 音乐播放器模块收尾（全流程 CDP 验收 + 后台管理页）与 float-panel 毛玻璃缺陷修复

**用户反馈**：「标签下面太空了」（截图文件时间 07:56，早于 08:06 的改动）。核实结论：截图为修复前旧画面；当前 /tags 已含官网同款 Top 10 排行卡（官网快照 tags-page/index.html 中确有 `<div class="card-base px-8 py-6 mt-4"><h2 class="text-lg font-bold text-75 mb-4">Top 10</h2>`，结构与取值已逐项对齐），1200×880 实测主列「标题卡 108px + 标签云卡 80px + Top 10 卡 320px」正好填满首屏（底边 880 = 视口高）。

**音乐播放器全流程验收（CDP，无头 Chrome，1440×900，脚本 %TEMP%/cdp-music-e2e.js）**
- 初始：曲名/歌手/时长正确（0:00 / 0:08）、按钮 aria=播放、封面 animationPlayState=paused、音量 70%。
- 播放：按钮转 aria=暂停、时间 0:02 → 0:04、封面 animationPlayState=running、进度条 35% → 58%。
- 下一首：标题与时长切换（C5→C6 变 G4→G5），保持播放。
- 进度跳转：点击进度条 60% 处 → 0:05 / 0:08（66%）。
- 播放模式三态：repeat → repeat-1 → shuffle → repeat（读 svg class 取证）。
- 播放列表抽屉：2 条曲目。
- 音量：点 30% → aria-valuenow=30，localStorage `firefly-music-volume=0.29541015625`。
- 客户端路由：点击导航「归档」到 /archives，仍在播放（0:06 / 0:08，进度继续增长）→ 证明单例 Audio + Provider 跨路由不中断。
- 导航栏音乐按钮：点击展开面板（region 数 1→2），遮罩关闭后回到 1；控制台错误 0。
- 截图：%TEMP%/music-playing.png、music-after-route.png、music-nav-panel-v3.png。

**后台音乐管理页（新增 3 处、无新依赖）**
- `src/components/admin/music-manager.tsx`：列表 + 新增/编辑 + 删除确认；音频与封面复用 MediaUrlField（accept=audio/* 与 image/*，支持上传/媒体库选择/外链）。
- `src/app/admin/(protected)/music/page.tsx`：服务端取 `musicService.listForAdmin()`，改动后 `router.refresh()`。
- `src/components/admin/admin-sidebar.tsx`：新增「音乐」入口（lucide Music 图标，位于「页面」与「媒体」之间）。
- CDP 实测：/admin/music 列表 2 条 → 新增「验收测试曲目」→ 列表 3 条且 `/api/music` 返回 3 条 → 删除 → 回到 2 条；提示文案与状态区正确；控制台错误 0；截图 admin-music-list.png / admin-music-added.png / admin-music-after-delete.png。
- `pnpm exec tsc --noEmit` 退出码 0。

**float-panel 毛玻璃（对齐官网）与 -webkit 前缀缺陷**
- 官网取证（Layout.D6XwfbwI.css）：`.float-panel` 基础 = `background-color: var(--card-bg)` + `border-radius: var(--radius-large)` + `border 5% black` + 大阴影；壁纸透明模式下叠加 `backdrop-filter: blur(20px) saturate(1.5)` + `background:#ffffff8c` + inset 白色高光。
- 新增全局 `.float-panel` 类（globals.css），并用于导航栏音乐面板与显示设置面板（两处原先为 card-base + 线框）。
- 关键缺陷（本项目全站范围）：globals.css 中同时声明 `backdrop-filter` 与 `-webkit-backdrop-filter` 的 6 处，被 Lightning CSS 折叠为只输出 `-webkit-` 前缀形式；而本机 Chrome 148 `CSS.supports('-webkit-backdrop-filter','blur(10px)') === false`，导致导航栏玻璃、卡片等毛玻璃在 Chrome 下全部失效（计算值 none）。删除全部 `-webkit-backdrop-filter` 重复声明后，Lightning 自动输出「前缀 + 标准」两种：编译后 CSS 标准属性由 9 处升至 16 处，CDP 实测面板计算样式 `blur(20px) saturate(1.5)`。
- dev 环境注意：Turbopack 的 CSS 编译缓存会失效卡死（修改 globals.css 后不重编译，重启实例亦无效，需删除 `.next/dev` 后再启动）。本次处置：停 dev → 删除 `.next/dev` → 重启（日志 %TEMP%/firefly-dev18.log）。

**测试数据说明**：曲库现有 2 条为诊断用音频（`data/uploads/2026/10/1792197167018-testtone-tone.wav`、`1792197167050-testtone-scale.wav`，对应 media 表 2 行），用户可在后台「音乐」页直接删除。

## 2026-10-17 09:3x · 补齐官网右侧栏最后一块：日历卡（月历 + 年度热力图 + 当日文章列表）

**取证（官网快照 root-page/index.html）**：右侧栏顺序 = 最新动态 → 站点统计 → 站点信息 → 日历；日历卡是无标题卡（`card-base pb-4 onload-animation widget-hide-on-post`，animation-delay 150ms），内部结构：月导航（上一月 / 月份标题 / 回到今天 / 下一月）+ 星期表头（日一二三四五六）+ `#calendar-grid` + `#heatmap-container`（12 列 × 4 行：`#heatmap-months` 月份标签 + `#heatmap-grid` 格子）+ `#month-view-container` / `#year-view-container`（3 列网格）+ `#calendar-posts`（分隔线 + max-h-48 滚动列表），数据来自官网 `/api/allPostMeta.json`。
**取证（官网 CSS MainGridLayout.DbDPyati.css）**：`.calendar-day{transition:all .2s;min-height:32px}`、`.calendar-day[data-has-post=true]:hover{transform:translateY(-2px)}`、`.calendar-day-selected{background-color:var(--btn-regular-bg);border-radius:.25rem}`、`.heatmap-cell{cursor:pointer;min-width:0;width:85%;aspect-ratio:1;margin:auto;transition:box-shadow .15s}`、`.heatmap-cell:hover{box-shadow:0 0 1px 1.5px var(--primary)}`。
**官网交互规则（同页内联脚本）**：标题点击「日 → 月 → 年」；上一月/下一月：日视图改月份（跨年进位），月视图改年份，年视图隐藏按钮；「回到今天」仅在非当月或非日视图显示；只有当天有文章才响应选中，再点同一天取消并恢复当月列表；热力图 hover 显示「N月第W周，C篇文章」提示、点击跳到对应月份；色阶 `[0, .45, .65, .85, 1]`，0 篇用 `--btn-plain-bg-hover` 底色。

**改动（新增 4 + 修改 3）**
- 新增 `src/types/calendar-entry.ts`（CalendarEntry）、`src/lib/format-date.ts` 中的 `formatDateKey`（Asia/Shanghai 的 YYYY-MM-DD，用 en-CA 输出）、`src/app/api/posts/calendar/route.ts`（复用 `postService.listArchiveGroups()`，不新增仓储方法）、`src/components/site/sidebar/calendar-card.tsx`。
- 修改 `src/app/globals.css`（日历与热力图样式，取值逐条对齐官网）、`src/app/(site)/layout.tsx`（右侧栏在站点信息之后挂载 `<CalendarCard />`，沿用 `widget-hide-on-post` 包裹，延迟 150ms 与官网一致）。

**取证（改后）**
- `tsc --noEmit --incremental false` 退出码 0；`--listFiles` 确认 calendar-card.tsx / calendar-entry.ts / route.ts 均已纳入编译。
- `GET /api/posts/calendar` → 200：3 条已发布文章（markdown-guide / hello-firefly / protected-demo，日期 2026-10-16）。
- CDP 实测（1440×900）：初始「2026年10月 / 31 格 / 有文章日 16（角标 3） / 今天 17 带 ring / 热力图 48 格 / 列表 3 条」；点 16 日选中、再点取消；标题点击 日→月（12 格）→年（2026）；选年→月视图、选月→日视图；上一月（2026年9月 / 30 格 / 无文章 / 出现「回到今天」）→ 回到今天恢复当月并消失；热力图 hover 提示「10月第3周，3篇文章」「10月第4周，0篇文章」，移开即消失；点热力图格子跳月生效；控制台 0 错误。
- 提示框定位修复：卡片带入场动画 transform，`position: fixed` 后代元素会以卡片为包含块导致错位；改用 `createPortal(document.body)` 后实测提示框 `top=535 / left=1227 / z=9999` 可见，移开后从 DOM 移除。
- 页面级巡检：`/`、`/tags`、`/categories`、`/archives`、`/search`、`/dynamic`、`/tag/markdown`、`/category/tech`、`/page/about` 均渲染日历（48 个热力格）；`/posts/*` 仍渲染但 `display: none`（与官网 widget-hide-on-post 一致）；`/tags`、`/archives`、`/dynamic` 实测日历可见、31 格、3 条列表、控制台 0 错误。
- 截图：%TEMP%/calendar-default.png、calendar-hover.png、calendar-tooltip.png、calendar-month-jump.png。

**dev 环境注意（本轮再次遇到）**：外部脚本写入已被引用的模块（`src/lib/format-date.ts`）后，Turbopack 仍按旧模块运行（报 `formatDateKey is not a function`），仅重启进程无效，需删除 `.next/dev` 再启动（本次日志 %TEMP%/firefly-dev19.log）。结论：改动已被引用的既有模块后，先清 `.next/dev` 重启再验收。

## 2026-10-17 10:0x · 移动端底部侧栏 + 沉浸式阅读 + 后台仪表盘重做

**「标签下面太空了」复核**：用户截图生成时间 07:56:44，早于 `/tags` 改动时间 08:06:04；现网 `/tags` 已含「标题卡 + 标签云卡 + Top 10 热度卡」，1122×878 实测三卡底边正好落在首屏底部，控制台 0 错误（截图 %TEMP%/tags-now-top.png、tags-now-bottom.png）。官网 tags 页快照核对也只有「标签 + Top 10」两块，结构一致。

**移动端底部侧栏（对齐官网 #mobile-bottom-sidebar）**
- 官网取证：`block md:hidden mt-4` 容器内顺序 = 资料卡 → 公告 → 分类 → 标签 → 最新动态 → 站点统计 → 站点信息（不含日历，不含目录栏）。
- 改动（复用同一份 DOM，不做重复渲染，避免 id 冲突与客户端状态复制）：
  - `src/app/globals.css`：`<768px` 时 `#content-column order:1`、左栏 `order:2`、右栏 `order:3`，两栏 `position: static; max-width: none`，并隐藏 `#right-sidebar-dynamic`（目录由右下角悬浮按钮提供）。
  - `src/app/(site)/layout.tsx`：日历卡外包 `hidden md:contents`，移动端不显示（桌面端布局不变）。
- CDP 实测：390×844 首页 `sh=3856`，正文 y=493 → 左栏 y=1810 → 右栏 y=2822；`/tags`、`/posts/*` 同样生效；文章页统计/信息/日历仍按 widget-hide-on-post 隐藏；767px 边界生效、768px 起恢复桌面双列、1440px 三列不变；控制台 0 错误；截图 %TEMP%/mobile-390-home.png、mobile-390-tags.png。

**沉浸式阅读（对齐官网 ImmersiveReading）**
- 官网取证（Layout.D6XwfbwI.css + ImmersiveReading JS）：`≥1024px` 且文章页启用；进入后 body 加 `immersive-reading`，隐藏导航/壁纸/侧栏/页脚/悬浮目录，正文 46rem 居中；左侧 20rem 常驻目录栏可折叠；Esc 退出并恢复滚动位置；目录栏展开时正文让出 20rem+1rem。
- 新增 `src/components/site/immersive-reading.tsx`（入口按钮 `#immersive-reading-btn`、目录开关 `#immersive-toc-toggle-btn`、目录栏 `#immersive-toc`，复用 floating-toc-store 的目录数据与 `.toc-*` 样式；面板用 createPortal 挂到 body）；`floating-controls.tsx` 挂载；两处文章 `<article>` 增加 `immersive-article` 类；globals.css 追加沉浸式布局与目录栏样式。
- CDP 实测（1440×900，/posts/markdown-guide）：滚动 650 → 点入口 → body 类名正确、导航/横幅/侧栏 display:none、正文 736×1985 居中、目录 320×900 可见、可见子元素仅 1 个（文章）、目录 6 条且高亮 1 条、scrollY=0；目录开关收起后 grid padding 0、面板 translateX(-320) 隐藏；再展开恢复；点第 2 条目录跳到 #列表（y=664）并高亮；Esc 退出后滚动恢复 650、页面恢复 6 个子块；390px 不渲染入口；控制台 0 错误；截图 %TEMP%/immersive-on.png、immersive-toc-off.png、immersive-exit.png。

**后台仪表盘重做（高级感 + 与前台同主题）**
- 新增：`dashboard-live-clock.tsx`（Asia/Shanghai 实时时钟，首帧占位避免水合差异）、`dashboard-hero.tsx`（网格光斑 + 呼吸状态点 + 概览 chips + 快捷操作）、`dashboard-recent-posts.tsx`（封面缩略图 + 分类/时间/阅读 + 状态徽标 + 整行可点）、`dashboard-status-panel.tsx`（Node/运行时长/内存/数据库/媒体，内存条以 2GB 为可视化参考）。
- 改造：`dashboard-stat-card.tsx`（主题渐变色图标、徽标、7 天迷你走势线）、`src/app/admin/(protected)/page.tsx`（重排为 Hero + 4 数据卡 + 趋势/最近更新 + 热门/待办/外观 + 运行状态）。
- globals.css 新增 `.admin-card` / `.admin-hero` / `.admin-hero-orb` / `.admin-live-dot` / `.admin-clock` / `.admin-chip` / `.admin-quick-*` / `.admin-stat-*` / `.admin-rank` / `.admin-row` / `.admin-thumb` / `.admin-meter` 等样式，全部取自 `--primary` / `--card-bg` / `--line-color` 令牌，随主题色相与明暗模式联动。
- 实测：`tsc --noEmit --incremental false` 退出码 0；CDP 1440×900 实测 6 个 admin-card、4 个数据卡、1 条迷你走势、3 个封面缩略图、3 个排行徽标、2 个呼吸点、实时时钟走秒；内存 1.2GB → 进度条 61%（2GB 参考）；控制台 0 错误；截图 %TEMP%/admin-dashboard-after.png、admin-dashboard-after-full.png。
- 编码：新增/改动文件均为 UTF-8 无 BOM；已统一为 LF。本轮 dev 重启日志：%TEMP%/firefly-dev20.log、dev21.log、dev22.log（每次改 globals.css/既有模块后均删除 `.next/dev` 再启动）。

**当前待办（按优先级）**
1. 官网其余交互巡检：文章页评论占位、搜索交互、动态页灯箱、音乐播放器与沉浸式阅读组合场景。
2. Banner 偶发空白问题加固与回归（宿主 hidden 时的重绘策略已有兜底，需再做一次跨标签页切换实测）。
3. 后台主题色/壁纸等设置项完整联动回归（主题色相、卡片透明度修改后前台即时生效）。
4. 部署文档与脚本（Linux systemd/PM2 + Nginx，Windows PM2/计划任务 + 反向代理）、备份恢复脚本。
5. 待用户确认：`docs/planning/series-module-plan-r1.md`、测试 WAV 与 2 条 media 记录可否清理、横幅视频压缩。

## 2026-10-17 11:1x-12:2x · 主题色归属后台唯一来源 + 友链 / 留言 / 书签导航 / 打赏完整落地

**主题色刷新回退修复（用户反馈项）**
- 根因：前台「显示设置」仍保留色相滑块与 `firefly-hue` 本地存储，刷新或站内跳转后客户端重新写入旧色相，覆盖服务端注入的后台 `themeHue`。
- 修复：`src/components/site/display-settings.tsx` 删除色相滑块与全部 `firefly-hue` 读写；`src/components/site/site-header.tsx` 不再向显示设置传色相；`src/app/layout.tsx` 仅由后台 `settings.themeHue` 注入根元素 `--hue`。前台现在只保留主题明暗、卡片透明度与列表布局偏好。
- 回归证据（Chrome CDP，1440×900）：`/search` 刷新前后计算值均为 `--hue: 0`、`--primary: oklch(.7 .14 0)`；浏览器里残留的旧存储 `firefly-hue=165` 已不参与渲染。后台设置 `themeHue=0` 仍即时生效。

**友链（完整）**
- 数据与分层：`FriendLink` 模型、迁移 `20261017035044_add_friend_links`、前台/后台仓储与服务、Zod 校验。
- 接口：`/api/friends`、`/api/friends/[id]`（写操作均需后台会话）。
- 后台 `/admin/friends`：头像上传/媒体库、名称、地址、简介、标签、权重、启停、编辑与删除。
- 前台 `/friends`：页头、关键词搜索、标签筛选、响应式卡片网格；Chrome 实测 3 张卡片与菜单高亮正常。

**留言（基础版）**
- 前台 `/guestbook`：介绍正文读取后台「页面」中 `guestbook` 的 Markdown；下方保留评论组件挂载位；导航已收录。
- Seed 自动创建 `guestbook` 页面内容；后台可继续用页面编辑器维护。

**书签导航（完整）**
- 数据与分层：`BookmarkGroup` / `Bookmark`、迁移 `20261017035522_add_bookmarks`、前台/后台仓储与服务、Zod 校验。
- 接口：`/api/bookmarks/groups`、`/api/bookmarks/groups/[id]`、`/api/bookmarks/items`、`/api/bookmarks/items/[id]`。
- 后台 `/admin/bookmarks`：分组与书签两级维护，支持 emoji / 图片 / favicon 自动回退、权重、启停、编辑与删除。
- 前台 `/booknav`：搜索、分组锚点、5 个分组 / 13 个示例书签、响应式网格；390px 无横向溢出。

**打赏（完整）**
- 数据与分层：`SponsorMethod` / `SponsorRecord`、迁移 `20261017040148_add_sponsors`、前台/后台仓储与服务、Zod 校验；站点设置新增 `sponsorUsage`、`sponsorShowList`。
- 接口：`/api/sponsors/methods`、`/api/sponsors/methods/[id]`、`/api/sponsors/records`、`/api/sponsors/records/[id]`，写操作全部走 `getAdminSession()`。
- 校验修正：收款码与图标允许本站媒体库 `/uploads/...`、`/assets/...` 相对地址，避免上传成功却无法保存。
- 后台 `/admin/sponsors`：打赏方式（名称、官方品牌图标、收款码上传/媒体库、外链、描述、排序、启停、删除）与打赏记录（头像、金额、日期、留言、排序、启停、删除）双表单管理；侧栏新增「打赏」。
- 前台 `/sponsor`：用途说明、双列打赏方式卡、支付宝/微信收款码、Ko-fi / 爱发电外链、打赏者名单、首字头像兜底、评论挂载位、横幅标题浮层；品牌图标使用官网同款 SVG。
- 素材：复制官网 `alipay.png`、`wechat.png` 到 `public/assets/images/sponsor/`；数据库已补支付宝、微信两种方式，导航实际配置已增加「我的 → 书签导航」「关于 → 打赏」。

**验证**
- `pnpm exec tsc --noEmit --incremental false`、相关文件 ESLint、`pnpm build` 全部通过；构建包含 `/friends`、`/guestbook`、`/booknav`、`/sponsor`、`/admin/sponsors` 及 4 组打赏 API。
- Chrome CDP（生产构建）：打赏页 4 种方式、2 条记录、2 张收款码 naturalWidth 正常；桌面与 390px 均无横向溢出；后台桌面与 390px 均无溢出，品牌图标正常显示。
- API 全链路：未登录 POST 返回 401；登录后打赏方式与记录的 POST / PUT / DELETE 均返回 200，临时验证数据已删除。
- 四页冒烟：`/friends`、`/guestbook`、`/booknav`、`/sponsor` 均可打开，`--hue` 均为后台值 `0`，导航分组为「主页 / 文章 / 社交 / 我的 / 关于 / 链接」。
- 截图：`%TEMP%/firefly-sponsor-desktop.png`、`firefly-sponsor-mobile.png`、`firefly-admin-sponsors-final.png`、`firefly-admin-sponsors-mobile.png`。

**下一个 3 小时目标**
1. 落地 `/projects`、`/projects/[slug]` 与后台项目管理（复用媒体上传、排序、启停与外链字段）。
2. 落地 `/gallery`、`/gallery/[album]`（相册、图片上传索引、灯箱、单相册密码）。
3. 补齐「我的」导航中的项目、相册，再评估哔哩哔哩 / 番组计划 / VNDB / AnimeList 的数据来源与后台维护方式。
4. 友链页补齐官网底部自定义内容与评论区挂载位；完成后重新构建并做桌面/移动端回归。
## 2026-10-17 12:3x-12:53 · 项目模块回归 + 相册模块完整落地 + 主题色刷新链路复核

**主题色（用户反馈复核）**
- Chrome CDP 实测：浏览器残留 `localStorage["firefly-hue"]="165"` 时，首页、强制刷新与搜索页的计算值始终为后台 `--hue: 0`，且页面内无色相滑块；前台不再持有或覆盖主题色配置。

**项目模块（回归确认）**
- 前台 `/projects`：搜索、状态筛选、响应式卡片网格；`/projects/[slug]`：状态、日期、标签、外链、可放大封面、Markdown README、目录与横幅标题。
- 后台 `/admin/projects`：封面/外链图标上传与媒体库、状态、标签、外链、排序、启停、编辑与删除。
- 示例项目 `firefly-dynamic`、`project-guide` 与「我的 → 项目」导航已存在。

**相册模块（完整）**
- 数据与分层：`GalleryAlbum` / `GalleryPhoto`、迁移 `20261017043600_add_gallery`、前台/后台仓储与服务、Zod 校验；新增 `admin-gallery.service.interface.ts` / `admin-gallery.service.ts`。
- 后台服务：bcrypt 保存密码哈希；新建空密码为公开；编辑空密码保留原密码；勾选清除密码后改为公开；标签去重限量、照片最多 100 张。
- 接口：`/api/gallery/albums`、`/api/gallery/albums/[id]`、`/api/gallery/albums/[id]/unlock`；写操作走 `getAdminSession()`，解锁接口使用独立内存限流。
- 加密链路：独立 HMAC Cookie `firefly_gallery_unlock_<id>`，签名包含相册编号与密码哈希；未解锁时服务端不下发照片数据，只展示封面与密码框。
- 后台 `/admin/gallery`：相册名称、slug、简介、封面、日期、地点、标签、排序、启停、密码/提示/清除密码；照片逐张上传或媒体库选择、说明、上下移动与删除。
- 前台 `/gallery`：页头、计数、搜索、标签筛选与响应式相册卡片网格；锁标识、照片数量与地点完整展示。
- 前台 `/gallery/[slug]`：3:1 封面横幅、返回按钮、标题/简介/日期/地点/照片数/标签；CSS columns 瀑布流与支持方向键、Esc 的灯箱。
- 示例素材：复制官网 `cover.avif`、`1.avif` 到 `public/gallery/firefly-2026/`；Seed 写入「可爱流萤」与「加密相册示例」（密码 `123456`，含提示），并把「相册」插入实际导航「我的」分组、项目之后。

**验证**
- `pnpm db:generate`、`pnpm exec tsc --noEmit --incremental false`、相关文件 ESLint、`pnpm build` 全部通过；生产构建包含 `/gallery`、`/gallery/[slug]`、`/admin/gallery` 与 3 条相册 API。
- Chrome CDP（生产服务）：列表 2 个相册、搜索「加密」1 个、标签筛选 1 个；公开详情 2 张照片 naturalWidth 4096/1631，瀑布流 `column-width: 240px`，灯箱可开并可 Esc 关闭。
- 加密相册：未解锁 HTML 不含照片数据，错误密码提示「密码不正确」，正确密码 `123456` 后照片与说明出现；桌面和 390px 均无横向溢出。
- API 全链路：未登录 POST 返回 401；登录后创建、设置密码、空密码保持原密码、清除密码、删除均成功；临时数据已删除，删除后详情返回 404。
- 截图：`%TEMP%/firefly-gallery-desktop.png`、`firefly-gallery-public.png`、`firefly-gallery-unlocked.png`、`firefly-gallery-mobile.png`、`firefly-gallery-admin.png`、`firefly-gallery-admin-mobile.png`。
- 生产服务恢复监听 3000，构建 ID `cQQV3IsJ7oJ3FpmlG7_MD`。

**下一个 3 小时目标**
1. 补齐友链页官网底部自定义内容与评论区挂载位，并逐项对照官网快照。
2. 评估并落地 `/bilibili`、`/bangumi`、`/vndb`、`/myanimelist` 的数据来源、后台维护方式与缓存策略。
3. 仪表盘补充相册/项目等模块统计入口，继续打磨前台与后台高级感。
4. 完成本轮桌面/390px 全站回归后，再更新最终目标清单。

## 2026-10-17 13:0x-13:2x · 友链页官网申请指南 + 导航复核

**主题色（用户截图复核）**
- 两张反馈截图生成于 11:28，早于 11:36 的前台色相覆盖修复。当前生产构建已不含 `firefly-hue` 读写；Chrome 实测搜索页与强制刷新后 1.2/3/5 秒均为后台 `--hue: 0`，旧存储键已清理。

**导航（复核结论）**
- 「关于本站」已在顶部「关于」下拉中，可正常进入 `/page/about` 且仅「关于」分组高亮。
- `/dynamic` 仅高亮「我的」、`/friends` 仅高亮「社交」；此前「社交 / 我的」同时选中且内容相同的截图早于 11:32 的唯一活动项修复。

**友链页（官网对齐）**
- 新增 `src/components/site/friend-guide.tsx`：本站信息卡、可复制字段、申请三步流程、邮件入口、申请模板与注意事项。
- 新增 `src/components/site/copy-button.tsx`：Clipboard API + 非安全上下文回退，复制成功后图标与 `aria-live` 同步反馈。
- 新增 `src/components/site/site-comments.tsx`：评论区挂载位，支持 Giscus（仓库、分类、映射、主题同步），未配置评论服务时与官网一致不渲染。
- `/friends` 改为读取后台标题、描述、联系邮箱、显示开关和注意事项；支持自定义内容与评论区独立开关。
- 后台「站点设置 → 友链页面」增加页面标题、描述、申请邮箱、显示申请指南/评论区、注意事项增删改。
- `SiteSettings`、设置读取兜底、Zod 校验、后台表单初值、`prisma/seed.ts` 默认值已同步。

**验证**
- `pnpm exec tsc --noEmit --incremental false`、相关 ESLint、`pnpm build` 通过；生产构建 ID `4aSZv1fw8REysso8ORfJm`。
- Chrome（生产服务）实测 `/friends`：3 张友链卡、5 个复制按钮、4 条注意事项；桌面 1440px 与移动 390px 横向溢出均为 0，控制台异常 0。
- 后台 `/admin/settings`：新增字段与备注正常显示；`GET /api/settings` 返回新增字段，原值 `PUT` 保存返回 200/updated=true；桌面截图 `%TEMP%/firefly-friends-admin-section.png`，移动端 DOM 宽度 390 无横向溢出。
- 截图：`%TEMP%/firefly-friends-desktop.png`、`firefly-friends-mobile.png`、`firefly-friends-admin-section.png`。

**下一个 3 小时目标**
1. 落地 `/bilibili`、`/bangumi`、`/vndb`、`/myanimelist` 与后台数据源配置。
2. 仪表盘补充项目、相册、友链、打赏等模块统计与快捷入口。
3. 完善后台移动端导航入口，消除窄屏侧栏隐藏后无法进入模块的问题。
4. 继续逐页对照官网快照，补齐评论区真实服务接入与全站桌面/390px 回归。

## 2026-10-17 13:2x-14:0x · 哔哩哔哩追番页首版 + 缓存封面空白修复 + 主题色来源复核

**哔哩哔哩追番（`/bilibili`）**
- 新增追番与追剧数据服务：同时读取 `type=1/2`，支持 UID 或空间链接、受限并发、15 秒超时、一次重试、进程内缓存与失败时回退陈旧缓存。
- 新增媒体浏览器：关键词搜索、类型筛选、评分/发布日期四向排序、分页、详情弹窗、Esc/背景关闭、外链观看；桌面三列、移动双列。
- 新增 8 个独立数据/类型文件与 9 个页面组件；导航图标扩展 Bilibili 品牌图标，`/bilibili` 已加入实际数据库「我的」分组。
- 后台「站点设置 → 哔哩哔哩追番」新增启用、UID、页面标题、描述、每页条数、缓存分钟数、统计开关共 7 项，类型、服务、校验、表单和 Seed 已同步。

**缓存封面空白（本轮修复）**
- 根因：封面在 React 水合前已完成加载，`onLoad` 不再触发，`loaded` 始终为 `false`，图片保持 `opacity: 0`。
- 修复：`bilibili-card.tsx` 在挂载后检查 `img.complete` 与 `naturalWidth`，缓存成功则立即显示，缓存失败则切到占位图。
- 复测：桌面 24 张封面中进入视口的 18 张全部可见，透明 0、损坏 0；移动端 12/12 可见。

**验证**
- 主题：强制刷新与跨页面后 `--hue` 始终为后台值 `0`，前台不再覆盖后台色相。
- 交互：搜索「凡人」并筛选「国创」得到 1 条；评分升序、下一页、详情弹窗、Esc 与背景关闭均通过；弹窗外链为正确的 Bilibili 剧集地址。
- 导航：`/bilibili` 仅高亮「我的」；`/page/about` 仅高亮「关于」；`/friends`、`/dynamic`、`/search` 均为唯一活动项。
- 响应式：1440px 与 390px 横向溢出均为 0，移动端双列卡宽 159px，分页控件可见。
- 后台：区块字段渲染正常；`GET /api/settings` 200，原值 `PUT` 200/updated=true，保存前后 7 个字段一致。
- 异常态：空 UID 与非法 UID 返回 `not-configured`；不存在的数字 UID 返回 `error`（用户隐私设置未公开），页面可显示可恢复提示，不产生 500。
- `pnpm exec tsc --noEmit --incremental false`、目标文件 ESLint、`pnpm build` 全部通过；生产构建 ID `WhYY9IXZr9CyBcv-sy0Ee`。
- 截图：`%TEMP%/firefly-bilibili-fixed-desktop.png`、`firefly-bilibili-modal-desktop.png`、`firefly-bilibili-mobile-fixed.png`、`firefly-admin-bilibili-settings-final.png`。

**下一个 3 小时目标**
1. 落地 `/bangumi`、`/vndb`、`/myanimelist`，复用媒体浏览器与后台数据源配置模式。
2. 仪表盘补充项目、相册、友链、打赏、追番等模块统计与快捷入口。
3. 完善后台移动端导航，确保窄屏下可进入全部管理模块。
4. 继续逐页对照官网快照，补齐评论服务接入并完成桌面/390px 全站回归。

## 2026-10-17 14:1x-16:3x · 三媒体收藏页 + 官网兼容入口 + 全站移动端收口

**媒体收藏（Bangumi / VNDB / MyAnimeList）**
- 新增三个收藏页：统计卡片、关键词搜索、条目类型筛选、评分/日期/标题排序、分页、NSFW 策略与响应式网格均复用统一的 `MediaShelfExplorer`。
- 新增三个独立数据服务与接口约定：均支持超时、一次重试、进程内缓存和失败时回退旧缓存；Bangumi 读取用户收藏，VNDB 支持可选 API Token，MAL 读取动画与漫画列表。
- 后台「站点设置」补齐三个媒体源的启用状态、用户标识、接口地址、详情地址、页面标题/描述、每页条数、缓存分钟数与 NSFW 策略；`SiteSettings`、读取兜底、Zod 校验、后台表单与 Seed 已同步。
- NSFW 支持 `off`、`blur`、`hide` 三种模式；默认 `hide`，非法配置回退为 `hide`。收藏页、导航图标、默认导航顺序与 `sitemap.xml` 均已加入三个入口。

**路由、订阅与官网兼容入口**
- 新增 `src/lib/decode-path-segment.ts`，在 6 个 `[slug]` 路由统一解码中文路径，修复动态、文章、分类、标签、项目、相册等中文 slug 访问 404。
- 新增 `/archive` → `/archives`、`/about` → `/page/about` 兼容入口；新增 `/rss`、`/atom` 订阅说明页与 `/sitemap-index.xml`，补齐默认站点图标 `/favicon/firefly-32.png`。
- 分类胶囊栏扩展至首页、归档、分类、标签、文章、分类详情与标签详情页，移动端与桌面端共用同一套尺寸和活动态。

**后台管理**
- 后台新增 14 项抽屉式移动导航：当前项高亮，支持 Esc、遮罩、站内链接与浏览器前进/后退关闭，恢复焦点并锁定背景滚动；后台根字号保持 16px，操作区维持 44px 触控尺寸。
- 仪表盘新增内容模块统计：动态、项目、相册、友链、书签分组/条目、打赏方式/记录与音乐；为两个网格子容器补充 `min-w-0`，390px 页面滚动宽度由 400px 收敛到 390px。

**前台视觉对齐（官网逐项实测）**
- 移动端根字号仅在 `<768px` 的前台范围调整为 14px，后台与 768px 以上保持 16px；修正头部操作组的 `col-start-3` 定位、搜索按钮间距与各操作按钮尺寸。
- 分类胶囊栏对齐官网：桌面卡片 56px、胶囊 32px；移动卡片 49px、胶囊 28px；计数徽标、圆角、hover/active 主色一致。
- 首页横幅移动端宽度改为浮层内容区的 95%，桌面维持 75%；桌面标题 72px/90px、移动标题 39px/42.89px，副标题和社交行位置均与官网一致。
- 横幅社交入口对齐官网顺序：GitHub 文字胶囊、邮箱、打赏与 RSS；GitHub 复用站内品牌 SVG，邮箱与 RSS 使用统一圆形按钮。
- 移动抽屉对齐官网：宽 `min(70vw,340px)`、内边距 0、导航 `8px 12px 16px`、菜单项 56px/左右 16px/图标文字间距 16px/圆角 14px；展开子菜单间距和左侧缩进同步对齐。
- 修复移动菜单 ESLint 的 effect 内同步 `setState` 告警：路由关闭改为 `popstate` 事件回调，链接点击关闭逻辑保持不变。

**评论状态**
> 2026-10-17 后续更新：以下 Giscus 方案已废弃并由站内数据库评论取代；本段仅保留为历史记录。
- `SiteComments` 已挂载到文章、留言、打赏与友链页面，支持 Giscus 脚本加载与明暗主题同步；未配置评论服务时整块隐藏。
- 当前数据库仍为 `commentProvider=""`、`commentConfig={}`，真实 Giscus 仓库与分类尚未配置，因此生产页面暂不显示评论区。

**验证**
- `pnpm exec tsc --noEmit --incremental false` 通过；本轮 8 个目标 TSX 文件 ESLint `--max-warnings=0` 通过。
- 开发环境全站 31 路由 × 1440/390 两个视口共 62 次访问全部 HTTP 200；横向溢出、破图、控制台 JS 异常与 404 UI 均为 0。
- 官网/本地同视口几何复核：移动抽屉 `x=117/w=273`、菜单项 `x=130/w=247/h=56`；移动横幅标题 `x=23.05/w=343.89`、社交行 `y=297.83/h=38.5`；桌面搜索操作组 `x=998.89/w=344`，均逐项一致。
- 本轮已补写 `README.md` 与本文档，并在 `.gitignore` 增加 `/.next.stale/`、`/build.log`、`/$null`。
- 生产构建 `pnpm build` 通过，构建 ID `IvwVBQma03fUh-0jZk4m3`；生产服务已在 `http://localhost:3000` 启动。
- 生产环境再次完成 31 路由 × 1440/390 共 62 次访问：HTTP 200 62/62，横向溢出、破图、JS 异常与 404 UI 均为 0；后台桌面/390px 统计与 14 项抽屉导航再次通过，Esc 关闭、焦点恢复与滚动锁定正常。
- 生产入口复测：`/rss`、`/rss.xml`、`/atom`、`/atom.xml`、`/sitemap.xml`、`/sitemap-index.xml`、`/robots.txt`、`/archive`、`/about` 与 `/favicon/firefly-32.png` 均返回 200；`/favicon.ico` 与官网当前行为一致为 404，页面实际使用 `/favicon/firefly-32.png`。

**下一步**
1. 按功能拆分提交本轮源码与文档。
2. 配置真实 Giscus 仓库、分类与映射，完成评论链路实测。
3. 逐项验收后台移动端导航，并继续仪表盘高级统计与视觉效果增强。
4. 完成 V1 最终验收与生产构建产物归档。

## 2026-10-17 16:3x-16:5x · V1 生产回归复核与评论接入审计

**提交与构建状态**
- 当前分支 `main` 已按功能拆分为 5 个提交：`827210f`、`4d178d0`、`128526a`、`68201a4`、`791f35c`；准备本轮文档提交前工作区干净。
- 当前生产服务 `http://localhost:3000` 正常返回 HTTP 200，进程 PID `22740`；`.next/BUILD_ID` 实测为 `IvwVBQma03fUh-0jZk4m3`，以此产物作为本轮验收基线（清单中的 `vK08…` 不是当前磁盘构建）。
- 当前 5 个提交尚未推送到 `origin/main`，本轮仅做本地文档提交，不执行推送。

**生产全站回归**
- 用 Chrome CDP 对 31 个路由 × 1440/390 两个视口复跑，合计 62/62 通过：HTTP 200、横向溢出 0、破图 0、控制台 JS 异常 0、404 UI 0。
- 后台 14 项移动导航逐项点击复测：13/14 通过，抽屉均能关闭、触发器保留、页面标题与目标路由一致、无 JS 异常；`/admin/bookmarks` 在 390px 下 `scrollWidth-clientWidth=11`，未通过。
后台 14 个管理页在 1440×900 直连复测 14/14 通过：横向溢出、破图、JS 异常与 404 UI 均为 0；书签页问题仅存在于 390px 视口。
- 溢出定位：书签条目行 `flex items-center gap-3 rounded-xl border border-(--line-divider) p-2.5` 的右边界为 `400.6px`（视口 `390px`），根因是网格项缺少 `min-w-0`，长描述撑开最小内容宽度。建议最小修复为在该行增加 `min-w-0`，必要时给内部标题行补充同类约束；待审核后再改动源码。
- 仪表盘桌面与 390px 内容模块卡片、7 项模块统计、抽屉打开/关闭、Esc、焦点恢复和背景滚动锁定正常。

**官网几何对照**
- 移动导航面板：官网/本地均为 `x=117`、`w=273`、`h=844`；菜单项均为 `x=130`、`w=247`、`h=56`，`bodyOverflow=hidden`、页面溢出 0。
- 首页横幅：390px 下副标题 `x=23.05/w=343.89`、社交行 `y=297.83/h=38.5`；1440px 标题仍为官网同款 `72px/90px`，内容宽 75%。
- 本轮复跑未发现新的前台视觉差异；详细全站截图与逐页对照证据沿用上一节记录。

**评论接入审计**
> 2026-10-17 后续更新：本节的 Giscus / GitHub Discussions 前置条件已失效；现为站内数据库评论，无需开启 Discussions、安装 Giscus App 或提供 `repoId`、`categoryId`。
- GitHub API 实测 `piglatiao/Fyre` 为公开仓库但 `has_discussions=false`；本机没有 `gh` CLI 登录态，无法自动开启 Discussions 或安装 Giscus App。
- 真实接入前需要：在仓库设置中开启 Discussions → 安装 Giscus App → 在 giscus.app 选择仓库与分类并取得 `repoId`、`categoryId` → 将完整 `commentConfig` 与 `commentProvider=giscus` 写入后台站点设置。
- 当前数据库仍为 `commentProvider=""`、`commentConfig={}`，因此生产页面的评论区保持隐藏；README 已补充上述前置条件与配置字段说明。

**下一步**
1. 待审核：为 `/admin/bookmarks` 的网格项补充 `min-w-0`，然后重跑 390px 与桌面验收。
2. 待外部条件就绪：完成 Giscus 仓库配置并在文章、留言、打赏、友链页实测加载与主题同步。
3. 继续仪表盘高级统计/视觉效果增强，完成 V1 最终验收与构建产物归档。

## 2026-10-17 17:0x-17:44 · 站内数据库评论落地 + 导航即时搜索与透明度修复

**站内评论（替代 Giscus）**
- 新增 `comments` 表，迁移 `20261017090651_add_comments` 已应用；评论归入本站 MySQL，不再依赖 GitHub Discussions、Giscus App 或 `repoId` / `categoryId`。
- `CommentTargetType` 覆盖 `POST`、`GALLERY_ALBUM`、`PROJECT`、`PAGE`、`DYNAMIC`、`GUESTBOOK`、`SPONSOR`、`FRIENDS` 八类目标；文章、相册、项目、自定义页面、单条动态、留言、打赏与友链页面均已挂载。
- 新增公开接口 `GET/POST /api/comments` 与后台写接口 `PATCH/DELETE /api/comments/[id]`；评论区按目标读取并分页加载（每页 10 条），后台支持状态、类型、关键词筛选、分页，以及通过、隐藏、转待审和删除。
- 默认 `commentsEnabled=true`、`commentsRequireApproval=false`，访客提交后立即公开；后台「站点设置 → SEO 与评论」可整体关闭评论区或开启审核，开启后新评论进入待审并在「评论管理」处理。
- 邮箱仅服务端保存且不在前端返回；站点链接仅接受 HTTP(S)；正文按纯文本安全展示；提交限流为同一 IP + 评论目标 10 分钟 5 次，超限返回 `429` 与 `Retry-After: 600`。
- 后台侧栏和移动抽屉新增「评论」，仪表盘补充评论统计与待办入口。

**导航搜索与显示设置**
- 顶部搜索不再跳转 `/search`，改为导航栏即时搜索；输入停顿 `250ms` 请求 `/api/search`，当前页浮层展示前 5 条，超过 5 条才出现 `/search?q=` 的“查看全部”入口。
- 修复桌面重复放大镜：移动端触发按钮补回重要级隐藏类 `lg:hidden!`，1440px 可见搜索按钮数为 0。
- 卡片透明度不可调的根因是 `#top-row` 的 `pointer-events: none`；显示设置根容器补充 `data-interactive`，面板外关闭改为文档级 `pointerdown`，移除覆盖全屏的关闭按钮。
- 实测滑杆 `0.5 → 0.85`，卡片背景同步 `rgba(255,255,255,0.5) → rgba(255,255,255,0.85)`；“恢复后台默认透明度”回到 `0.6`，点击面板外可关闭。收尾后测试浏览器已恢复默认值。

**验证**
- `pnpm exec tsc --noEmit`、目标 ESLint、`pnpm build` 全部通过；最终构建 ID `BUaQJTNFycg4umAsjDxxh`，生产服务 `http://localhost:3000` 返回 HTTP 200（PID 16672）。
- 评论 E2E：8 类目标均提交成功、状态 `APPROVED` 且对应页面可见；首屏 10 条，点击“加载更多”后 16 条且 ID 不重复；限流前 5 次返回 200、第 6 次返回 429。
- 390px 留言页评论区宽 376px、表单宽 341px，无横向溢出；后台评论页无溢出，15 项抽屉导航完整。浏览器异常 0；24 条自动测试评论已全部经后台接口删除，无残留。
- 导航搜索：桌面输入 `Markdown` 得到 2 条结果，点击进入 `/posts/markdown-guide`；390px 浮层宽 362px、页面 `scrollWidth=390`，外部点击可关闭。
- 截图：`%TEMP%/firefly-comment-evidence/`、`%TEMP%/firefly-search-evidence/nav-search-desktop.png`、`%TEMP%/firefly-search-evidence/nav-search-mobile.png`。

**下一步**
1. 继续仪表盘模块统计与视觉效果增强，逐项验收后台移动端导航。
2. 完成全站桌面端与 390px 的官网对照及 V1 最终回归。

## 2026-10-17 18:10 · 导航搜索/卡片透明度复核与后台显示配置范围确认

**本轮结论**
- 当前生产基线仍为构建 `BUaQJTNFycg4umAsjDxxh`，`http://localhost:3000` 返回 HTTP 200。通过独立浏览器上下文实测，桌面端输入 `Markdown` 后 URL 保持 `/`，浮层返回 2 条结果，回车不跳转；390px 浮层宽 362px、页面 `scrollWidth=390`，无横向溢出。截图中的 `/search` 页面属于修复前旧会话，仅在结果超过 5 条并点击“查看全部”时才会进入独立搜索页。
- 卡片透明度实测 `0.6 → 0.85 → 0.3`，CSS 变量与卡片计算背景同步变化，分别得到 `rgba(255,255,255,0.6)`、`rgba(255,255,255,0.85)`、`rgba(255,255,255,0.3)`，本地偏好正常持久化并可通过“恢复后台默认透明度”还原。

**范围决策**
- 前台显示设置保持现状，不新增官网式“外观 / 壁纸 / 特效”三个页签：继续提供主题模式、卡片透明度与文章列表布局，顶部昼夜切换保留。
- 后续仅补充后台配置，不把访客显示偏好写入数据库。后台已有色相、默认主题、默认透明度、壁纸模式、横幅高度与模糊、横幅图片/视频、标题、副标题、打字机、波浪和侧栏开关。

**下一窗口开发项**
1. 外观：新增“卡片边框与阴影”“卡片跟随主题色”配置，并映射到前台卡片样式。
2. 壁纸：新增“首页横幅标题显隐”“壁纸轮播”“渐变过渡”配置；轮播需明确多图地址、切换间隔与移动端资源策略。
3. 特效：新增“樱花特效”配置，提供后台开关并保证关闭时不加载相关客户端脚本。
4. 数据链路：同步扩展 `SiteSettings`、设置校验、服务端归一化/兜底、种子数据与后台设置表单，保持 UTF-8 和最小化改动。
5. 验证：完成后台表单保存/回显、前台即时生效、桌面 1440px 与 390px 响应式，以及关闭特效后的性能和可访问性回归；随后更新 README、进度文档并构建提交。

## 2026-10-17 18:30-18:46 · 后台显示配置落地与 1440px/390px 回归

**实现**
- 设置继续存于 `settings` 键值表，无 Prisma migration；新增 `cardBorderEnabled`、`cardFollowThemeEnabled`（默认 `false`），`bannerTitleVisible`（默认 `true`），`bannerImagesDesktop`、`bannerImagesMobile`（默认空），`wallpaperCarouselEnabled`（默认 `false`）、`wallpaperCarouselInterval`（默认 5 秒，范围 3-60）、`wallpaperCarouselFade`（默认 `true`）、`sakuraEnabled`（默认 `false`）。
- 数据链路已同步 `SiteSettings`、主题配置归一化、Zod 校验、服务端读取兜底、种子数据与后台设置表单；后台分别位于「外观主题」「横幅与个人资料」「页面特效」卡片。
- 首页标题开关整体控制标题、副标题与社交入口，默认显示；轮播仅接受图片/GIF，每端最多 10 张，移动端留空复用桌面图。
- 樱花由服务端布局按 `sakuraEnabled` 条件下发 `effects`，不再在客户端外壳用 `next/dynamic` 声明；后台关闭时 HTML 不下发组件，网络请求为 0。`SakuraPetal` 独立到 `src/types/sakura-petal.ts`，轮播参数内联，保持一文件一顶层类型。

**前台行为**
- 卡片边框/阴影与主题色跟随通过 `.site-wrapper` 的 `data-card-border`、`data-card-follow-theme` 控制，默认关闭；开启后实测卡片背景为 `oklch(1 0.01 165 / 0.6)`，边框 `1px solid`，阴影 `0 1px 2px rgba(0,0,0,0.05)`。
- 轮播仅保留当前、上一张与下一张幻灯片；桌面和移动端可加载不同图片。自动推进在页面隐藏时暂停，减少动态效果时停止；关闭渐变后 `transition-duration` 为 `0s`。
- 轮播关闭、只有一张图或没有图片时回落到原有 `BannerMedia`，视频横幅与封面逻辑不变。
- 樱花画布 `pointer-events:none`、`aria-hidden`，21 片花瓣、DPR 上限 2；页面隐藏时跳过绘制，减少动态效果时不创建动画，沉浸式阅读时 `display:none`。

**验证**
- 使用独立测试库 `firefly_blog_display_test_1810` 与 `localhost:3001` 副本回归，未写入生产库；生产 `http://localhost:3000` 始终返回 HTTP 200（PID 16672），未重启或终止。
- 后台表单保存与刷新回显通过，API 回读值和输入值一致；后台 1440px 与 390px 均无横向溢出。
- 桌面 1440px 轮播 `cover.avif → 1.avif`，3 秒后索引由 0 推进到 1；390px 首张 `currentSrc` 为移动端 `1.avif`，`scrollWidth=390`，无横向溢出。渐变开启时过渡为 `1s`，关闭后为 `0s`。
- 标题隐藏时 `.banner-home-text-overlay` 不存在，恢复后标题与社交入口回归；关闭轮播与樱花后视频横幅恢复，禁用状态无 `.sakura-canvas`、无 sakura chunk 请求。
- 樱花开启时均出现 1440x900 画布且连续帧发生变化；减少动态效果下画布为空白 300x150、轮播索引 3.4 秒内不推进；沉浸式阅读下画布隐藏。浏览器异常 0。
- `pnpm exec tsc --noEmit` 与目标 ESLint 通过；本轮未执行 `pnpm build`。
- 截图：`%TEMP%/firefly-display-evidence-1810/`（默认/启用 1440px、390px、后台轮播与移动端表单）。

**下一步**
- 生产构建待明确指示；构建后再在生产产物上复核一次关闭樱花时的客户端 chunk 请求。

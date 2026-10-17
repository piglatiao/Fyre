# 站点外壳规格（导航栏 / 横幅 / 页脚 / 悬浮控件）

## 1. 顶部行 + 导航栏（`#top-row` / `#navbar`）

DOM（首页，壁纸模式=banner，动态导航）：

```
#top-row  固定定位 z-80 h-18(4.5rem) 全宽; xl 宽度 92vw, max-width: var(--page-width)
  #navbar-wrapper
    #navbar  玻璃面板（内部第一个 div 承担背景/阴影）
```

- 高度：`h-18` = 4.5rem；内部 `.h-18` 容器 + `px-4`
- 三列栅格：`grid-cols-[auto_minmax(0,1fr)_auto]`，垂直居中；左：Logo + 站名（`btn-plain h-13 px-3 md:px-5 font-bold`，图标 `h-7 w-7 mr-2 mb-1`，文字 `text-md`）；中：桌面导航（`hidden lg:flex justify-center space-x-1`）；右：搜索 / 显示设置 / 移动端菜单
- 导航项：`btn-plain scale-animation rounded-lg h-10 font-bold px-4`，内容 `flex items-center gap-1.5`，图标 `text-[1.1rem] mr-1.5`；hover 背景 `--btn-plain-bg-hover`
- 玻璃效果：`--navbar-glass-blur: 12px`；面板背景 `--card-bg-transparent` + `backdrop-filter: blur(var(--navbar-surface-blur))`，描边由 `box-shadow: inset 0 1px 0 var(--navbar-glass-highlight), 0 1px 0 var(--navbar-glass-hairline)` 提供
- 透明模式 `semi`（首页 banner 模式）：面板半透明；滚动后（body.scrolled / dynamic-navbar）固定为 `h-4.5rem` 并启用模糊
- 首页顶部时导航栏位于横幅之上（无实底），滚动后浮起为玻璃条

## 2. 横幅 / 壁纸（首页 65vh，其余 max(45vh,380px)）

- 尺寸：`--banner-height-home: 65vh`；`--banner-height-non-home: max(45vh, 380px)`
- 结构：`#wallpaper-wrapper`（绝对定位在最上层画布）> `#wallpaper-gradient` > `#banner-images-container`（每张图 `slide-item`，`<img class="w-full h-full object-cover">`，`object-position: 0% 20%`）> `#banner-overlay-container`
- 遮罩：图片上叠 `dark:bg-black/10`；文字叠加层 `banner-home-text-overlay`（`absolute inset-0 z-20 flex items-center justify-center`），内容宽 `w-4/5 lg:w-3/4 text-center`
- 标题：`.banner-title` `font-bold text-white leading-tight`，字号 `min(var(--banner-title-size,3rem),10vw)`（桌面 4.5rem），`text-shadow: 2px 2px 8px rgba(0,0,0,.8)`，入场动画 `banner-fadeInUp .3s`
- 副标题：`.banner-subtitle` `text-white/90`，桌面 1.5rem，`text-shadow: 1px 1px 4px rgba(0,0,0,.7)`，打字机循环（速度 100ms/字符，删除 50ms，停顿 2000ms，多条轮播）
- 社交链接：`.banner-links` `mt-5 flex gap-3`（延迟 .5s 入场）；`.banner-link` 2.75rem 圆形，`background: rgba(255,255,255,.14)`，`border: 1px solid rgba(255,255,255,.18)`，`backdrop-filter: blur(8px)`，hover `rgba(255,255,255,.26)` + `translateY(-2px) scale(1.05)`
- 底部波浪：`.waves` `absolute -bottom-px w-full h-[15vh]`（移动端 10vh），SVG `viewBox="0 24 150 28"`，路径 `M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v48h-352z`，四层 `<use>` 透明度 .25/.50/.65/.75 + x 偏移（0/0.25/0.5/0.75 相位），填充 `var(--page-bg)`，持续水平平移（官方 canvas 实现，本项目用 CSS animation 平移）
- 滚动指示器：首页显示，底部居中，点击滚动到 `#main-grid`

## 3. 内容面板与主栅格

- `#content-panel` 绝对定位 `w-full z-30`，内容面板 `xl:w-[92vw] max-w-(--page-width) mx-auto`
- 面板相对横幅上移：banner 模式下 `--content-top: calc(var(--banner-height-home) - 3.5rem)`；非首页窄横幅 `5.5rem`
- `#main-grid`：`grid gap-4 px-2 md:px-4`；md+ 两列 `17.5rem 1fr`；xl 三列 `17.5rem 1fr 17.5rem`（左栏表头 md 起含，右栏仅 xl+）
- 移动端（<768px）不显示侧栏（`mobile-no-sidebar`）
- 侧栏粘性：`position: sticky; top: 5.5rem`

## 4. 页脚

```
<footer class="site-footer pb-4 md:pb-6">
  分隔线: border-t border-black/10 dark:border-white/15 border-dashed mx-32 mt-10 mb-5
  文案容器: flex flex-col items-center px-6; 文字 text-50 text-sm
  行1: © {year} {站点名}. All Rights Reserved. / RSS / Atom / Sitemap（间隔 <span>/</span>，链接 text-(--primary) font-medium）
  行2: Powered by {站点名}（链接主色）
  行3: ICP 备案号（如有）
  间距：my-2.5, gap-x-2 gap-y-2.5
```

## 5. 悬浮控件

- 悬浮 TOC：右下角按钮 `card-base rounded-2xl`（图标 format-list-bulleted / close 切换），点击展开面板 `rounded-2xl shadow-2xl backdrop-blur-lg border border-white/20 md:w-80`，面板内 TOC 列表；无目录时显示「当前页面没有目录」
- 返回顶部：右下角圆形按钮，滚动 > 400px 显示，平滑滚动到顶
- 显示设置面板（导航栏调色盘图标）：主题模式（亮/暗/跟随系统）三选一 + 色相滑块（0-360，实时写入 `--hue`）+ 卡片透明度滑块（写入 `--card-transparent-opacity`）

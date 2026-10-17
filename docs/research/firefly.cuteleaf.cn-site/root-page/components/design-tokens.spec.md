# Firefly 设计令牌（Design Tokens）

- 来源：https://firefly.cuteleaf.cn/ 首页内联样式与 `Layout.D6XwfbwI.css`（getComputedStyle 等价物：直接取自发布产物 CSS，非估算）
- 主题色机制：全站色彩由单一 `--hue`（0-360）驱动，官方默认 `--configHue: 165`；`localStorage.hue` 可覆盖（站点设置面板调色盘写入）
- 页面尺寸：`--page-width: 100rem`；内容面板 `xl:w-[92vw] max-w-(--page-width)`；主网格 `gap: 1rem`（gap-4），左右留白 `px-2 md:px-4`
- 栅格：`--grid-sidebar-width: 17.5rem`；md+ `17.5rem 1fr`（只显示左栏）；xl+ `17.5rem 1fr 17.5rem`（左右双栏）
- 圆角：`--radius-large: 1rem`（卡片）；按钮 `rounded-lg`(0.5rem)；胶囊 `rounded-full`
- 动效：`--duration-normal .15s`、`--duration-medium .2s`、`--duration-slow .25s`、`--duration-slower .3s`、`ease-standard cubic-bezier(.4,0,.2,1)`；入场动画 `fade-in-up .12s`（onload-animation，逐项 30ms 递增延迟）
- 文字透明度体系：`text-90` = black/90%（深色 white/90%）、`text-75` = 75%、`text-50` = 50%、`text-30` = 30%（`color-mix(in oklab, black X%, transparent)`）

## 亮色令牌（`:root`）

```
--primary: oklch(.7 .14 var(--hue));
--page-bg: oklch(.95 .01 var(--hue));
--card-bg: #fff;
--card-bg-transparent: rgb(255 255 255 / var(--card-transparent-opacity, .6));
--btn-content: oklch(.55 .12 var(--hue));
--btn-regular-bg: oklch(.95 .025 var(--hue));
--btn-regular-bg-hover: oklch(.9 .05 var(--hue));
--btn-regular-bg-active: oklch(.85 .08 var(--hue));
--btn-plain-bg-hover: oklch(.95 .025 var(--hue));
--btn-plain-bg-active: oklch(.98 .01 var(--hue));
--btn-card-bg-hover: oklch(.98 .005 var(--hue));
--btn-card-bg-active: oklch(.9 .03 var(--hue));
--deep-text: oklch(.25 .02 var(--hue));
--title-active: oklch(.6 .1 var(--hue));
--line-divider: rgba(0,0,0,.08);
--line-color: rgba(0,0,0,.1);
--meta-divider: rgba(0,0,0,.2);
--content-meta: rgba(0,0,0,.7);
--inline-code-bg: var(--btn-regular-bg);
--inline-code-color: var(--btn-content);
--muted: oklch(.93 .015 var(--hue));
--selection-bg: oklch(.9 .05 var(--hue));
--codeblock-bg: oklch(.17 .015 var(--hue));
--codeblock-topbar-bg: oklch(.3 .02 var(--hue));
--license-block-bg: rgba(0,0,0,.03);
--link-underline: oklch(.93 .04 var(--hue));
--link-hover: oklch(.95 .025 var(--hue));
--link-active: oklch(.9 .05 var(--hue));
--float-panel-bg: #fff;
--scrollbar-bg: rgba(0,0,0,.4);
--admonitions-color-tip: oklch(.7 .14 180);
--admonitions-color-note: oklch(.7 .14 250);
--admonitions-color-important: oklch(.7 .14 310);
--admonitions-color-warning: oklch(.7 .14 60);
--admonitions-color-caution: oklch(.6 .2 25);
--toc-badge-bg: oklch(.9 .045 var(--hue));
--toc-indicator-bg: oklch(.92 .015 var(--hue));
--toc-item-active: oklch(.7 .13 var(--hue));
```

## 暗色令牌（`:root.dark`）

```
--primary: oklch(.75 .14 var(--hue));
--page-bg: oklch(.16 .014 var(--hue));
--card-bg: oklch(.23 .015 var(--hue));
--card-bg-transparent: rgb(23 23 23 / var(--card-transparent-opacity, .6));
--navbar-glass-highlight: rgba(255,255,255,.06);
--navbar-glass-hairline: rgba(255,255,255,.1);
--btn-content: oklch(.75 .1 var(--hue));
--btn-regular-bg: oklch(.33 .035 var(--hue));
--btn-regular-bg-hover: oklch(.38 .04 var(--hue));
--btn-regular-bg-active: oklch(.43 .045 var(--hue));
--btn-plain-bg-hover: oklch(.3 .035 var(--hue));
--btn-plain-bg-active: oklch(.27 .025 var(--hue));
--btn-card-bg-hover: oklch(.3 .03 var(--hue));
--btn-card-bg-active: oklch(.35 .035 var(--hue));
--line-divider: rgba(255,255,255,.08);
--line-color: rgba(255,255,255,.1);
--meta-divider: rgba(255,255,255,.2);
--content-meta: rgba(255,255,255,.6);
--muted: oklch(.25 .015 var(--hue));
--selection-bg: oklch(.4 .08 var(--hue));
--codeblock-bg: oklch(.17 .015 var(--hue));
--codeblock-topbar-bg: oklch(.12 .015 var(--hue));
--license-block-bg: var(--codeblock-bg);
--link-underline: oklch(.4 .08 var(--hue));
--link-hover: oklch(.4 .08 var(--hue));
--link-active: oklch(.35 .07 var(--hue));
--float-panel-bg: oklch(.19 .015 var(--hue));
--toc-btn-hover: oklch(.28 .04 var(--hue));
--toc-item-active: oklch(.35 .07 var(--hue));
```

## 通用组件类（官方 CSS 定义）

- `.card-base`：`background-color: var(--card-bg-transparent)`（重要：`!important`）
- `.btn-regular`：背景 `--btn-regular-bg`，文字 `--btn-content`；hover/active 切换对应令牌
- `.btn-plain`：无底色，文字 black/75%（暗色 white/75%），hover/active 用 `--btn-plain-bg-hover/-active`
- `.btn-card`：卡片式按钮，背景 `--btn-card-bg-hover`（默认态近似），hover/active `--btn-card-bg-hover/-active`
- `.category-pill`：`border:1px solid color-mix(in srgb,var(--btn-content) 12%,transparent)`；`color: var(--btn-content)`；激活态 `background: var(--btn-content)` + 白字；`border-radius:9999px`
- `.tag-item`：`background: color-mix(in srgb,var(--btn-content) 8%,transparent)`；`color: var(--btn-content)`；`border-radius:9999px`
- `.link-lg`：`:before` 伪元素圆角背景，hover 时 `background: var(--btn-plain-bg-hover)`，`scale .85 -> 1`，过渡 `.15s ease-out`
- `.widget-title`：`font-bold text-lg`；左侧 `before` 竖条 `1px*1rem` 圆角，`background: var(--primary)`，偏移 `left:-16px top:5.5px`
- `.onload-animation`：`opacity:0; animation: fade-in-up .12s ease-out forwards`，延迟 0/30/60/90ms 递增
- 选区颜色：`::selection { background: var(--selection-bg) }`
- 滚动条：亮色 thumb `rgba(0,0,0,.4)`，暗色 `rgba(255,255,255,.4)`

## 字体

- 官方：`--font-sans: "Roboto","sans-serif",ui-sans-serif,system-ui,...`（站内自托管）；本项目按需求不引外链，沿用系统字体栈（中文回退 PingFang SC / Microsoft YaHei / Noto Sans SC）
- 正文行高 1.8；标题字重 700；文章标题 `text-3xl md:text-[2.25rem]/[2.75rem]`

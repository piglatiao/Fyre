# 文章详情页规格

结构（对应 `post-guide/index.html`，内容列宽内）：

```
#content-wrapper
  #category-bar-wrapper  （分类条，与首页一致，带当前分类高亮）
  main
    文章卡片: card-base px-6 md:px-9 pt-6 pb-4 rounded-(--radius-large) mb-4
      字数/阅读时间行: flex gap-5 text-black/30 dark:text-white/30 mb-3
        项: h-6 w-6 rounded-md bg-black/5 dark:bg-white/10 图标 + text-sm（"xxx 字" / "x 分钟"）
      标题: font-bold mb-3 text-3xl md:text-[2.25rem]/[2.75rem] text-black/90 dark:text-white/90
            左侧主色竖条 before:w-1 before:h-5 before:rounded-md before:bg-(--primary) md:before:block（top-3 -left-4.5）
      元信息: 日期（日历图标）/ 分类（书本图标，链接 hover 主色）/ 标签（标签图标 + 分隔符 "/"）
              text-50 text-sm font-medium；分隔符 text-(--meta-divider)
      正文: .article-body（详见下方排版）
    过期提示卡（可选，暂不实现）
    上下篇: flex flex-col md:flex-row justify-between gap-4 mb-4
        按钮: btn-card rounded-2xl w-full h-15 px-4 flex items-center gap-4
              前一篇 chevron-left + 标题（text-ellipsis）；后一篇 标题 + chevron-right；图标 text-[2rem] text-(--primary)
    相关文章卡（可选，本项目以「最新文章」列表替代）: card-base p-5 md:p-6
        头部: 图标（主色）+ 标题 font-bold + 右侧徽标 text-xs px-2 py-0.5 rounded-full bg-(--btn-regular-bg) text-(--btn-content)
        列表项: 序号徽标 w-6 h-6 rounded-md bg-(--enter-btn-bg) text-(--primary) + 标题 + 摘要，hover 主色
    版权/许可卡: card-base p-5 md:p-6（许可 block 背景 --license-block-bg，圆角 1rem）
    评论区容器预留: card-base p-5 md:p-6 + 标题「评论」
  侧栏 TOC（xl+）: card-base p-4，标题样式同 widget-title，列表项 hover 主色、激活项主色；移动端用悬浮 TOC 面板
```

## 正文排版（.article-body 等价值，取自官方 markdown 样式）

- 行内：`font-size: 1rem; line-height: 1.8;` 颜色 `text-75`（暗色 white/75）
- 标题：h2 `1.5rem`、h3 `1.25rem`、h4 `1.1rem`，`font-bold`，上间距 `2rem/1.75rem/1.5rem`，下间距 `.75rem`；标题前无竖条，hover 显示锚点
- 链接：主色（`--primary`）下划线 `--link-underline`，hover 变 `--link-hover` 背景混合
- 引用：左侧 4px 主色边框，背景 `rgba(0,0,0,.03)`（暗色主色 8% 透明），圆角 `.75rem`，内边距 `1rem`
- 行内代码：背景 `--inline-code-bg`，文字 `--inline-code-color`，圆角 `.375rem`，padding `.15em .4em`
- 代码块：背景 `--codeblock-bg`，顶部条 `--codeblock-topbar-bg`（高 2rem，含语言名与复制按钮），内容 padding `1rem`，圆角 `.75rem`，字体 `ui-monospace`
- 表格：`w-full border-collapse`，表头背景 `--btn-regular-bg`，单元格 `border: 1px solid var(--line-divider)`，padding `.5em .75em`；外框圆角
- 图片：`rounded-xl`，居中，`max-width: 100%`，figcaption 居中 `text-30 text-sm`
- 分割线：`border-top: 1px dashed var(--line-divider)`，上下 2rem
- 任务列表、脚注：沿用 markdown 输出样式

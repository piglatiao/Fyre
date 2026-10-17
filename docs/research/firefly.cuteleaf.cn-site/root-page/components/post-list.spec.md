# 文章列表规格（分类条 / 文章卡片 / 分页）

## 1. 分类条（首页与归档页顶部）

- 容器：`card-base category-bar p-3`，内部 `flex gap-2`
- 「主页」胶囊：图标式 `category-pill text-sm px-3 py-1.5`（激活态：底色 `--btn-content`、白字）
- 「归档」胶囊：文字 + 计数 `pill-count`
- 分隔线：`category-divider`（`w-px bg-(--line-color)`，高约 1.5rem）
- 分类胶囊：`category-pill text-sm px-4 py-1.5 whitespace-nowrap`（横向滚动区，两侧渐隐遮罩 `scroll-fade`）
- 「更多」胶囊：文字 + chevron 图标，跳转分类总览

## 2. 文章卡片（列表模式 list-mode）

```
.post-card-wrapper.has-cover.card-base.flex.flex-col-reverse.w-full.rounded-(--radius-large).overflow-hidden.relative
  .post-card-content  pl-4 md:pl-9 pr-4 md:pr-2 pt-4 md:pt-7 pb-4 md:pb-7
                       md:w-[calc(100%-var(--coverWidth)-1.5rem)]  (--coverWidth: 30%)
    .post-card-title  font-bold mb-3 text-3xl text-90 hover:text-(--primary)
                      before:w-1 before:h-5 before:rounded-md before:bg-(--primary)
                      before:absolute before:top-[35px] before:left-[18px] before:hidden md:before:block
    .post-meta-root   flex flex-wrap items-center gap-4 text-neutral-500 dark:text-neutral-400 mb-4
        置顶徽标: bg-(--btn-regular-bg) text-(--btn-content) rounded-md px-2 py-1.5 font-bold + 图钉图标
        日期: 图标 + text-50 text-sm font-medium
        分类: 图标 + text-50 text-sm font-medium hover:text-(--primary)
    .description      text-75 md:pr-4 line-clamp-2（--descriptionClampLines: 2）
    .post-card-bottom-tags  flex flex-wrap items-center mt-auto pt-3 gap-1.5
        .tag-item text-xs font-medium px-2.5 py-1（最多显示 3 个，其余 `+N` 静态标签）
  .post-card-image    w-full md:w-(--coverWidth) aspect-2/1 md:aspect-auto
                      md:absolute md:top-4 md:bottom-4 md:right-4 rounded-xl overflow-hidden
      hover 蒙层 bg-black/30 + 中央箭头图标；图片容器 group-hover:scale-110
```

- 无封面变体：`.no-cover`，内容宽度 `calc(100% - 64px)`（列表模式）
- 置顶卡片：左上角图钉徽标 + `pinned` 类
- 列表模式由容器 `#post-list-container.list-mode` 控制，卡片间距 `gap-4`，`mb-4`
- 移动端默认网格布局（`grid-cover-inset`：封面在上方）

## 3. 分页

- 桌面（lg+）：页码胶囊 `inline-flex h-9 min-w-9 rounded-full`，当前页 `bg-(--btn-content) text-white`，其余 `hover:bg-(--btn-plain-bg-hover)`；首末页固定 + 当前页 ±1 + 省略号
- 移动端：紧凑型「上一页 / x / y / 下一页」按钮
- 容器：`pagination-wrapper max-w-full`，居中，`mt-4`

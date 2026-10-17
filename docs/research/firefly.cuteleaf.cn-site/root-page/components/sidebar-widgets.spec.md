# 侧栏组件规格（左栏：资料卡 / 公告 / 分类 / 标签；右栏：最新文章 / 站点统计 / 站点信息）

通用容器：`widget-layout` 外层 `class="card-base pb-4 onload-animation"`（入场延迟 50ms 递增）；
标题：

```
<div class="widget-title font-bold text-lg relative ml-8 mt-4 mb-2
            before:w-1 before:h-4 before:rounded-md before:bg-(--primary)
            before:absolute before:left-[-16px] before:top-[5.5px]">
  <span class="widget-name">公告</span>
</div>
```

内容容器：`class="collapse-wrapper overflow-hidden px-4"`（可折叠组件用 `--collapsedHeight: 7.5rem`）

## 1. 资料卡（左栏第一位，`card-base p-3`）

- 头像链接：`mx-auto mt-1 lg:mx-0 lg:mt-0 mb-3 rounded-xl overflow-hidden`，hover 蒙层 `bg-black/30` + 中央图标（地址卡）淡入放大
- 站名：`font-bold text-xl text-center mb-1`
- 主色小条：`h-1 w-5 bg-(--primary) mx-auto rounded-full mb-2`（站名下方 5px*1px 圆角条）
- 简介：`text-center text-neutral-400 mb-2.5`
- 社交按钮：`btn-regular rounded-lg h-10 w-10 active:scale-90`（flex-wrap 居中，gap-2，图标 1.5rem）

## 2. 公告

- 正文：`text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3`（支持纯文本，按换行分段）

## 3. 分类

- 列表项：`flex items-center justify-between`，链接文字 `text-neutral-700 dark:text-neutral-300`，计数 `text-xs`
- 超长折叠：`--collapsedHeight: 7.5rem`，底部「展开/收起」按钮 `btn-plain w-full text-sm`

## 4. 标签

- 标签云：`tag-item px-2.5 py-1 text-xs font-medium`，换行排布 gap-1.5；折叠高度同上

## 5. 最新文章（右栏）

- 每项：`group flex items-center gap-3 px-3 py-3 -mx-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5`
- 序号徽标：`shrink-0 w-6 h-6 rounded-md bg-(--enter-btn-bg) text-(--primary) text-sm font-bold`
- 标题：`font-bold text-sm truncate group-hover:text-(--primary)`；下方一行显示分类徽标与摘要（`text-xs text-black/30`）

## 6. 站点统计（右栏）

- 行式布局：`flex items-center justify-between px-3 py-2 rounded-lg`
- 左：图标（主色，text-lg）+ 名称 `text-neutral-700 dark:text-neutral-300 font-medium text-sm`
- 右：数值 `text-xs font-bold text-right max-w-[55%] truncate`
- 统计项：文章数、分类数、标签数、总阅读量、运行天数

## 7. 站点信息（右栏）

- 同上行式布局，条目：构建平台（本项目显示 Next.js）、博客版本、文章许可（CC BY-NC-SA 4.0）、最后更新（最新文章时间）

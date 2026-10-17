# 归档页规格

```
#content-wrapper
  archive-panel.card-base.px-8.py-6
    筛选提示行（可选）: mb-5 text-50，命中筛选时显示「分类/标签: X（N 篇文章）」
    年份块 .archive-year-block（每个年份一组，默认展开）
      年份切换头: flex items-center h-15 rounded-lg hover:bg-(--btn-plain-bg-hover) group
        年份: w-[15%] md:w-[10%] text-2xl font-bold text-right text-75 group-hover:text-(--primary)
        节点: w-[15%] md:w-[10%] 中央圆点 h-3 w-3 rounded-full outline-(--primary) outline-3 -outline-offset-2
        计数: w-[70%] md:w-[80%] text-left text-50 「13 篇文章」+ 展开箭头（chevron，宽 1rem，展开时旋转 180°）
      年份内容 .archive-year-content
        文章行: group btn-plain block h-10 w-full rounded-lg hover:text-[initial]
          日期: w-[15%] md:w-[10%] text-sm text-right text-50（MM-DD）
          时间轴: w-[15%] md:w-[10%] relative dashed 竖线 + 中央节点 w-1 h-1 rounded-sm
                  bg-[oklch(.5 .05 var(--hue))] group-hover:h-5 group-hover:bg-(--primary) outline-4 outline-(--card-bg)
          标题区: w-[70%] md:w-[65%] font-bold text-75 group-hover:translate-x-1 group-hover:text-(--primary)
                  分类徽标 text-xs px-1.5 py-0.5 rounded-sm bg-[oklch(.95 .025 var(--hue))] dark:bg-[oklch(.25 .025 var(--hue))]
                  text-(--primary)，hover 反色为主色底白字
          标签列（md+）: w-[15%] text-sm text-30 「#标签1 #标签2」
```

- 交互：点击年份头折叠/展开该年份；默认全部展开
- 筛选（本项目）：归档页支持 `?category=slug` 与 `?tag=slug` 查询，顶部显示筛选行

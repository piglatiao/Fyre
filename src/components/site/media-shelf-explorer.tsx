"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { MediaShelfItem } from "@/types/media-shelf-item";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";
import ClientPagination from "./client-pagination";
import MediaShelfCard from "./media-shelf-card";

// 使用确定性的字符比较，避免服务端与浏览器的 ICU 排序差异造成水合不一致
function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

// 通用媒体浏览器：分类、状态、关键词、排序与分页叠加过滤
export default function MediaShelfExplorer({
  items,
  pageSize,
  searchPlaceholder,
  itemLabel,
  showAllTab = false,
  showStatusFilters = true,
  nsfwMode = "off",
}: {
  items: MediaShelfItem[];
  pageSize: number;
  searchPlaceholder: string;
  itemLabel: string;
  showAllTab?: boolean;
  showStatusFilters?: boolean;
  nsfwMode?: MediaNsfwMode;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(showAllTab ? "all" : items[0]?.categoryId ?? "all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"score-desc" | "score-asc" | "date-desc" | "title-asc">("score-desc");
  const [currentPage, setCurrentPage] = useState(1);

  // 分类顺序沿用服务端返回顺序，保留官网的分类排列
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const item of items) {
      const current = counts.get(item.categoryId);
      counts.set(item.categoryId, {
        label: item.categoryLabel,
        count: (current?.count ?? 0) + 1,
      });
    }
    return [...counts.entries()].map(([id, option]) => ({ id, ...option }));
  }, [items]);

  // 状态筛选项只保留实际存在的数据，避免无效空筛选
  const statusOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const item of items) {
      const current = counts.get(item.statusKey);
      counts.set(item.statusKey, {
        label: item.statusLabel,
        count: (current?.count ?? 0) + 1,
      });
    }
    return [...counts.entries()].map(([id, option]) => ({ id, ...option }));
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = items.filter((item) => {
      const categoryMatched = activeCategory === "all" || item.categoryId === activeCategory;
      const statusMatched = !showStatusFilters || activeStatus === "all" || item.statusKey === activeStatus;
      const keywordMatched = !keyword || [
        item.title,
        item.subtitle,
        item.categoryLabel,
        item.statusLabel,
        item.meta,
        item.progress,
        item.summary,
        item.tags.join(" "),
      ].some((value) => value.toLowerCase().includes(keyword));
      return categoryMatched && statusMatched && keywordMatched;
    });

    result.sort((a, b) => {
      if (sortBy === "score-desc" || sortBy === "score-asc") {
        if (a.score === 0 && b.score > 0) return 1;
        if (b.score === 0 && a.score > 0) return -1;
        const direction = sortBy === "score-desc" ? -1 : 1;
        return (a.score - b.score) * direction || compareText(a.title, b.title);
      }
      if (sortBy === "date-desc") {
        return compareText(b.sortDate, a.sortDate) || compareText(a.title, b.title);
      }
      return compareText(a.title, b.title);
    });
    return result;
  }, [activeCategory, activeStatus, items, query, showStatusFilters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / Math.max(1, pageSize)));
  const safePage = Math.min(currentPage, totalPages);
  const pagedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  // 切换分类或状态时回到第一页，避免落在不存在的页码
  function selectCategory(id: string): void {
    setActiveCategory(id);
    setCurrentPage(1);
  }

  function selectStatus(id: string): void {
    setActiveStatus(id);
    setCurrentPage(1);
  }

  return (
    <div className="min-w-0">
      <div className="mb-5 border-b border-(--line-divider)">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <nav aria-label="媒体分类" className="flex min-w-max gap-6">
            {showAllTab ? (
              <button
                type="button"
                aria-pressed={activeCategory === "all"}
                onClick={() => selectCategory("all")}
                className={
                  "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors " +
                  (activeCategory === "all"
                    ? "border-(--primary) text-(--primary)"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400")
                }
              >
                全部
                <span className="rounded-full bg-(--btn-regular-bg) px-2 py-0.5 text-xs text-(--btn-content)">
                  {items.length}
                </span>
              </button>
            ) : null}
            {categoryOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={activeCategory === option.id}
                onClick={() => selectCategory(option.id)}
                className={
                  "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors " +
                  (activeCategory === option.id
                    ? "border-(--primary) text-(--primary)"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400")
                }
              >
                <span aria-hidden className="size-2 rounded-full bg-(--primary)" />
                {option.label}
                <span className="rounded-full bg-(--btn-regular-bg) px-2 py-0.5 text-xs text-(--btn-content)">
                  {option.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            aria-label={`搜索${itemLabel}`}
            className="w-full rounded-xl border border-(--line-divider) bg-(--card-bg) py-2.5 pr-4 pl-10 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-(--primary) dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as typeof sortBy);
            setCurrentPage(1);
          }}
          aria-label="排序方式"
          className="shrink-0 cursor-pointer rounded-xl border border-(--line-divider) bg-(--card-bg) px-3 py-2.5 text-sm text-neutral-600 outline-none dark:text-neutral-400"
        >
          <option value="score-desc">评分最高</option>
          <option value="score-asc">评分最低</option>
          <option value="date-desc">最近更新</option>
          <option value="title-asc">名称排序</option>
        </select>
      </div>

      {showStatusFilters ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={activeStatus === "all"}
            onClick={() => selectStatus("all")}
            className={
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
              (activeStatus === "all"
                ? "bg-(--primary) text-white"
                : "bg-(--btn-regular-bg) text-(--btn-content) hover:bg-(--btn-regular-bg-hover)")
            }
          >
            全部状态
          </button>
          {statusOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={activeStatus === option.id}
              onClick={() => selectStatus(option.id)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                (activeStatus === option.id
                  ? "bg-(--primary) text-white"
                  : "bg-(--btn-regular-bg) text-(--btn-content) hover:bg-(--btn-regular-bg-hover)")
              }
            >
              {option.label}
              <span className="ml-1 opacity-60">{option.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-black/45 dark:text-white/45">
        <span>当前筛选共 {filteredItems.length} {itemLabel}</span>
        <span>第 {safePage} / {totalPages} 页</span>
      </div>

      {pagedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pagedItems.map((item) => (
            <MediaShelfCard
              key={`${item.categoryId}-${item.id}`}
              item={item}
              blurCover={nsfwMode === "blur" && item.nsfw}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Search aria-hidden className="mx-auto mb-4 size-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">没有找到匹配的内容</p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">换个关键词、分类或状态再试试。</p>
        </div>
      )}

      <ClientPagination
        page={safePage}
        totalItems={filteredItems.length}
        pageSize={pageSize}
        itemLabel={itemLabel}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

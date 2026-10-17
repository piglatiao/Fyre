"use client";

import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { getBilibiliSeasonTypeMeta } from "@/lib/bilibili-season-type";
import type { BilibiliAnime } from "@/types/bilibili-anime";
import BilibiliCard from "./bilibili-card";
import BilibiliDetailModal from "./bilibili-detail-modal";
import ClientPagination from "./client-pagination";

// 稳定的标题比较，避免服务端与浏览器 locale 差异影响水合结果
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// 哔哩哔哩媒体浏览器：关键词搜索、类型筛选、评分/日期排序、分页与详情弹窗
export default function BilibiliExplorer({ items, pageSize }: { items: BilibiliAnime[]; pageSize: number }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>(() => {
    const firstType = [...new Set(items.map((item) => item.seasonType || 1))].sort((a, b) => a - b)[0];
    return firstType ? String(firstType) : "";
  });
  const [sortBy, setSortBy] = useState<"rating-desc" | "rating-asc" | "date-desc" | "date-asc">(
    "rating-desc",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnime, setSelectedAnime] = useState<BilibiliAnime | null>(null);

  // 类型筛选项由实际数据动态生成，并统计各类型总条目数
  const typeOptions = useMemo(() => {
    const counts = new Map<number, { label: string; dotClass: string; count: number }>();
    for (const item of items) {
      const seasonType = item.seasonType || 1;
      const meta = getBilibiliSeasonTypeMeta(seasonType, item.seasonTypeName);
      const current = counts.get(seasonType);
      counts.set(seasonType, {
        label: meta.label,
        dotClass: meta.dotClass,
        count: (current?.count ?? 0) + 1,
      });
    }
    return [...counts.entries()].sort(([a], [b]) => a - b);
  }, [items]);

  // 叠加搜索、类型筛选与排序
  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = items.filter((item) => {
      const typeMatched = !activeFilter || item.seasonType === Number(activeFilter);
      const searchMatched =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.seasonTypeName.toLowerCase().includes(keyword) ||
        item.tags.some((tag) => tag.toLowerCase().includes(keyword));
      return typeMatched && searchMatched;
    });

    result.sort((a, b) => {
      if (sortBy === "rating-desc" || sortBy === "rating-asc") {
        const direction = sortBy === "rating-desc" ? -1 : 1;
        return (a.rating - b.rating) * direction || compareText(a.title, b.title);
      }
      const direction = sortBy === "date-desc" ? -1 : 1;
      return a.releaseDate.localeCompare(b.releaseDate) * direction || (b.rating - a.rating);
    });
    return result;
  }, [activeFilter, items, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / Math.max(1, pageSize)));
  const safePage = Math.min(currentPage, totalPages);
  const pagedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  // 切换类型：再次点击当前类型时取消筛选并展示全部
  const toggleFilter = useCallback((value: string): void => {
    setActiveFilter((current) => (current === value ? "" : value));
    setCurrentPage(1);
  }, []);

  // 详情弹窗的关闭回调保持稳定，避免弹窗内副作用重复绑定
  const closeDetail = useCallback((): void => {
    setSelectedAnime(null);
  }, []);

  return (
    <div className="media-list min-w-0">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
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
              placeholder="搜索番剧..."
              aria-label="搜索番剧"
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
            <option value="rating-desc">评分最高</option>
            <option value="rating-asc">评分最低</option>
            <option value="date-desc">最新发布</option>
            <option value="date-asc">最早发布</option>
          </select>
        </div>

        <div className="mb-1 border-b border-(--line-divider)">
          <div className="overflow-x-auto">
            <nav aria-label="按类型筛选" className="flex min-w-max gap-7">
              {typeOptions.map(([value, option]) => {
                const active = activeFilter === String(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    title={active ? "再次点击取消筛选" : `只看${option.label}`}
                    onClick={() => toggleFilter(String(value))}
                    className={
                      "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors " +
                      (active
                        ? "border-(--primary) text-(--primary)"
                        : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-300")
                    }
                  >
                    <span aria-hidden className={`size-2 rounded-full ${option.dotClass}`} />
                    {option.label}
                    <span className="rounded-full bg-(--btn-regular-bg) px-2 py-0.5 text-xs text-(--btn-content)">
                      {option.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {pagedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {pagedItems.map((anime, index) => (
            <BilibiliCard
              key={anime.id}
              anime={anime}
              onOpen={setSelectedAnime}
              priority={index < 6}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Search aria-hidden className="mx-auto mb-4 size-10 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">没有找到匹配的内容</p>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">换个关键词或类型再试试。</p>
        </div>
      )}

      <ClientPagination
        page={safePage}
        totalItems={filteredItems.length}
        pageSize={pageSize}
        itemLabel="部"
        onPageChange={setCurrentPage}
      />

      <BilibiliDetailModal anime={selectedAnime} onClose={closeDetail} />
    </div>
  );
}

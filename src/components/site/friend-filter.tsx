"use client";

import { ExternalLink, Search, SearchX, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { FriendLink } from "@/types/friend-link";

// 友链筛选：按关键词与标签即时过滤，交互与官网 FriendFilter 一致
export default function FriendFilter({ items }: { items: FriendLink[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");

  // 汇总全部标签并按名称排序，保证筛选胶囊顺序稳定
  const allTags = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b, "zh-CN")),
    [items],
  );

  // 同时应用标签与关键词过滤；关键词覆盖标题、简介、地址与标签
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const tagMatched = activeTag === "all" || item.tags.includes(activeTag);
      if (!tagMatched) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return [item.title, item.description, item.siteUrl, ...item.tags].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [activeTag, items, query]);

  return (
    <>
      <div className="mb-6">
        <div className="relative mb-3">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索友链..."
            aria-label="搜索友链"
            className="w-full rounded-xl border border-(--line-divider) bg-transparent py-2.5 pr-4 pl-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-(--primary) focus:ring-1 focus:ring-(--primary) dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>
        {allTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-active={activeTag === "all" ? "" : undefined}
              onClick={() => setActiveTag("all")}
              className="category-pill px-3 py-1.5 text-sm font-medium"
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                data-active={activeTag === tag ? "" : undefined}
                onClick={() => setActiveTag(tag)}
                className="category-pill px-3 py-1.5 text-sm font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {visibleItems.length > 0 ? (
        <div className="friends-grid my-4">
          {visibleItems.map((item) => (
            <a
              key={item.id}
              href={item.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="friend-card group relative flex items-center gap-3 overflow-hidden rounded-xl border border-(--line-divider) p-2.5 transition-all duration-300 hover:border-(--primary) hover:bg-(--card-bg) hover:shadow-lg"
            >
              <div className="pointer-events-none absolute inset-0 bg-(--primary) opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
              <ExternalLink
                aria-hidden
                className="absolute top-3 right-3 size-4 -translate-x-2 text-(--primary) opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
              />
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-zinc-100 transition-transform duration-300 group-hover:scale-105 dark:border-white/5 dark:bg-zinc-800">
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-(--primary)">
                  {item.title.trim().charAt(0) || "友"}
                </span>
                {item.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 友链头像由后台配置任意来源
                  <img
                    src={item.avatarUrl}
                    alt={item.title}
                    className="absolute inset-0 size-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 grow flex-col justify-center gap-0.5">
                <div className="truncate pr-4 text-base font-bold text-neutral-900 transition-colors group-hover:text-(--primary) dark:text-neutral-100">
                  {item.title}
                </div>
                <div className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400" title={item.description}>
                  {item.description || item.siteUrl}
                </div>
                {item.tags.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-neutral-100 px-1.5 py-0.5 text-[0.65rem] text-neutral-500 transition-colors duration-300 dark:bg-neutral-800 dark:text-neutral-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-500">
          {items.length === 0 ? (
            <>
              <UsersRound aria-hidden className="mb-3 size-10" />
              <div className="text-sm">暂无友情链接</div>
            </>
          ) : (
            <>
              <SearchX aria-hidden className="mb-3 size-10" />
              <div className="text-sm">没有找到匹配的友链</div>
            </>
          )}
        </div>
      )}
    </>
  );
}

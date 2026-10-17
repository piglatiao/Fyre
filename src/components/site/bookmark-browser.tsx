"use client";

import { ExternalLink, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import BookmarkIcon from "@/components/bookmark-icon";
import type { BookmarkGroup } from "@/types/bookmark-group";

// 书签导航前台：搜索过滤、分类锚点与响应式卡片网格
export default function BookmarkBrowser({ groups }: { groups: BookmarkGroup[] }) {
  const [query, setQuery] = useState("");

  // 按标题、描述与地址过滤；过滤后为空的分组不再展示
  const visibleGroups = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return groups;
    }
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          [item.title, item.description, item.url].some((value) => value.toLowerCase().includes(keyword)),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  // 滚动到分类分组，避开吸顶导航
  function scrollToGroup(slug: string): void {
    document.getElementById(`bookmark-group-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400 dark:text-neutral-500">
        <BookmarkIcon icon="🔖" title="书签" className="mb-4 size-16 rounded-2xl bg-(--btn-regular-bg) text-3xl" />
        <p className="text-lg">暂无书签</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索书签..."
          aria-label="搜索书签"
          className="w-full rounded-xl border border-(--line-divider) bg-transparent py-2.5 pr-4 pl-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-(--primary) focus:ring-1 focus:ring-(--primary) dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>

      {visibleGroups.length > 0 ? (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {visibleGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => scrollToGroup(group.slug)}
                className="category-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
              >
                {group.icon && !/^https?:\/\//i.test(group.icon) && !group.icon.startsWith("/") ? (
                  <span aria-hidden>{group.icon}</span>
                ) : null}
                {group.name}
                <span className="rounded-full bg-(--btn-regular-bg) px-1.5 text-[11px] text-(--btn-content)">
                  {group.items.length}
                </span>
              </button>
            ))}
          </div>

          <div>
            {visibleGroups.map((group) => (
              <section
                key={group.id}
                id={`bookmark-group-${group.slug}`}
                className="bookmark-group mb-8 last:mb-2"
              >
                <div className="mb-3 flex items-center gap-2 border-b border-(--line-divider) pb-2">
                  {group.icon ? (
                    <BookmarkIcon
                      icon={group.icon}
                      title={group.name}
                      className="size-7 rounded-lg bg-(--btn-regular-bg) text-base"
                    />
                  ) : null}
                  <div className="flex min-w-0 items-baseline gap-2">
                    <h2 className="shrink-0 text-lg font-bold text-neutral-900 dark:text-neutral-100">{group.name}</h2>
                    {group.description ? (
                      <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">{group.description}</span>
                    ) : null}
                  </div>
                </div>
                <div className="booknav-grid">
                  {group.items.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.description || item.title}
                      className="booknav-card group relative flex items-center gap-3 overflow-hidden rounded-xl border border-(--line-divider) p-3 transition-all duration-300 hover:border-(--primary) hover:bg-(--card-bg) hover:shadow-lg"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-(--primary) opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
                      <BookmarkIcon
                        icon={item.icon}
                        title={item.title}
                        url={item.url}
                        className="relative size-14 rounded-xl border border-black/5 bg-zinc-100 text-xl transition-transform duration-300 group-hover:scale-105 dark:border-white/5 dark:bg-zinc-800"
                      />
                      <ExternalLink
                        aria-hidden
                        className="absolute top-3 right-3 size-4 -translate-x-2 text-(--primary) opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      />
                      <div className="flex min-w-0 grow flex-col justify-center">
                        <div className="truncate pr-4 text-base font-bold text-neutral-900 transition-colors group-hover:text-(--primary) dark:text-neutral-100">
                          {item.title}
                        </div>
                        <div className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                          {item.description || item.url}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400 dark:text-neutral-500">
          <SearchX aria-hidden className="mb-3 size-10" />
          <p className="text-sm">没有找到匹配的书签</p>
        </div>
      )}
    </div>
  );
}

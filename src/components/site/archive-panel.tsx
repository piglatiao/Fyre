"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMonthDay } from "@/lib/format-date";
import type { ArchiveGroup } from "@/types/archive-group";

// 归档面板：按年份分组，可折叠的时间线列表
export default function ArchivePanel({ groups }: { groups: ArchiveGroup[] }) {
  const [collapsedYears, setCollapsedYears] = useState<number[]>([]);

  // 切换年份折叠状态
  function toggleYear(year: number): void {
    setCollapsedYears((current) =>
      current.includes(year) ? current.filter((item) => item !== year) : [...current, year],
    );
  }

  return (
    <div className="card-base mb-4 rounded-(--radius-large) px-4 py-6 md:px-8">
      {groups.map((group) => {
        const collapsed = collapsedYears.includes(group.year);
        return (
          <div key={group.year}>
            <button
              type="button"
              aria-expanded={!collapsed}
              onClick={() => toggleYear(group.year)}
              className="group/yr flex h-15 w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-(--btn-plain-bg-hover)"
            >
              <span className="text-75 w-[15%] text-right text-2xl font-bold transition group-hover/yr:text-(--primary) md:w-[10%]">
                {group.year}
              </span>
              <span className="w-[15%] md:w-[10%]">
                <span className="mx-auto block size-3 rounded-full outline-3 -outline-offset-2 outline-(--primary)" />
              </span>
              <span className="text-50 flex w-[70%] items-center gap-2 text-left transition group-hover/yr:text-(--primary) md:w-[80%]">
                <span>{group.entries.length}</span>
                <span>篇文章</span>
                <span className={collapsed ? "transition" : "rotate-180 transition"}>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </span>
            </button>
            {collapsed ? null : (
              <div>
                {group.entries.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/posts/${entry.slug}`}
                    aria-label={entry.title}
                    className="group btn-plain block! h-10 w-full rounded-lg"
                  >
                    <span className="flex h-full flex-row items-center justify-start">
                      <span className="text-50 w-[15%] text-right text-sm transition md:w-[10%]">
                        {formatMonthDay(entry.publishedAt)}
                      </span>
                      <span className="relative flex h-full w-[15%] items-center md:w-[10%]">
                        <span className="mx-auto block h-1 w-1 rounded-sm bg-[oklch(0.5_0.05_var(--hue))] outline-4 outline-(--card-bg) transition-all group-hover:h-5 group-hover:bg-(--primary) group-hover:outline-(--btn-plain-bg-hover)" />
                      </span>
                      <span className="text-75 flex w-[70%] items-center gap-2 overflow-hidden text-left font-bold text-ellipsis whitespace-nowrap pr-8 transition-all group-hover:translate-x-1 group-hover:text-(--primary) md:w-[65%] md:max-w-[65%]">
                        {entry.category ? (
                          <span className="inline-block shrink-0 rounded-sm bg-[oklch(0.95_0.025_var(--hue))] px-1.5 py-0.5 text-xs font-medium text-(--primary) transition-colors group-hover:bg-(--primary) group-hover:text-white dark:bg-[oklch(0.25_0.025_var(--hue))]">
                            {entry.category.name}
                          </span>
                        ) : null}
                        <span className="truncate">{entry.title}</span>
                      </span>
                      <span className="text-30 hidden text-left text-sm overflow-hidden text-ellipsis whitespace-nowrap transition md:block md:w-[15%]">
                        {entry.tags.map((tag) => `#${tag.name}`).join(" ")}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

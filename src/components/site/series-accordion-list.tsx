"use client";

import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { SeriesSummary } from "@/types/series-summary";

// 系列总览卡组：同一时间仅展开一个系列，交互与官网一致
export default function SeriesAccordionList({ series }: { series: SeriesSummary[] }) {
  const [openName, setOpenName] = useState<string | null>(null);

  return (
    <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] items-start gap-4">
      {series.map((group) => {
        const open = openName === group.name;
        const contentId = `series-accordion-${encodeURIComponent(group.name)}`;
        return (
          <div key={group.name} className="card-base overflow-hidden rounded-(--radius-large)" data-series-group={group.name}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={contentId}
              onClick={() => setOpenName(open ? null : group.name)}
              className="group flex w-full cursor-pointer items-center gap-3 p-5 pb-3 text-left transition select-none md:p-6 md:pb-3"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--primary)/10 transition-colors group-hover:bg-(--primary)/20">
                <Layers aria-hidden className="size-6 text-(--primary)" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-90 block truncate text-lg font-bold transition group-hover:text-(--primary)">
                  {group.name}
                </span>
                <span className="text-30 mt-0.5 block text-sm transition group-hover:text-(--primary)/60">
                  {group.posts.length} 篇文章
                </span>
              </span>
              <ChevronDown
                aria-hidden
                className={`text-30 size-5 shrink-0 transition-transform duration-300 group-hover:text-(--primary) ${open ? "rotate-180" : ""}`}
              />
            </button>
            <div
              id={contentId}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <ol className="flex flex-col px-5 pb-4 md:px-6">
                  {group.posts.map((post, index) => {
                    const isLast = index === group.posts.length - 1;
                    return (
                      <li key={post.id}>
                        <Link
                          href={`/posts/${post.slug}`}
                          className={`group -mx-1 flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-black/5 active:scale-[0.98] dark:hover:bg-white/5 ${
                            isLast ? "" : "border-b border-dashed border-(--line-divider)"
                          }`}
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-(--enter-btn-bg) text-sm font-bold text-(--primary) transition">
                            {index + 1}
                          </span>
                          <span className="text-75 min-w-0 flex-1 truncate text-sm font-bold transition group-hover:text-(--primary)">
                            {post.title}
                          </span>
                          <ChevronRight
                            aria-hidden
                            className="size-5 shrink-0 text-black/15 transition group-hover:translate-x-0.5 group-hover:text-(--primary) dark:text-white/15"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

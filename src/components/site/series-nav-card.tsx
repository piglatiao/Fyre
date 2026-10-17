"use client";

import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import type { PostSummary } from "@/types/post-summary";

// 文章页「所属系列」导航：默认折叠，当前篇高亮，其余文章可跳转
export default function SeriesNavCard({
  series,
  posts,
  currentSlug,
}: {
  series: string;
  posts: PostSummary[];
  currentSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const contentId = `series-nav-${useId().replace(/:/g, "")}`;

  return (
    <div className="series-nav my-3 overflow-hidden rounded-xl border border-(--primary)/25" data-series-nav>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="group flex w-full items-center gap-2 rounded-lg bg-(--btn-plain-bg-hover) px-3 py-1.5 text-left transition select-none"
      >
        <Layers aria-hidden className="size-[1.125rem] shrink-0 text-(--primary)" />
        <span className="min-w-0 truncate text-base font-bold text-black/80 transition group-hover:text-(--primary) dark:text-white/80">
          所属系列：{series}
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-(--btn-regular-bg) px-2 py-0.5 text-xs text-(--btn-content) transition">
          {posts.length}
        </span>
        <ChevronDown
          aria-hidden
          className={`size-5 shrink-0 text-(--primary) transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ol className="mt-1 flex flex-col">
            {posts.map((post, index) => {
              const current = post.slug === currentSlug;
              const isLast = index === posts.length - 1;
              return (
                <li key={post.id}>
                  {current ? (
                    <span
                      aria-current="page"
                      title={`第 ${index + 1} 篇`}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-1.5 ${
                        isLast ? "" : "border-b border-dashed border-(--line-divider)"
                      }`}
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-(--enter-btn-bg) text-sm font-bold text-(--primary) transition">
                        {index + 1}
                      </span>
                      <span className="text-75 min-w-0 flex-1 truncate text-sm font-bold transition">
                        {post.title}
                      </span>
                      <span className="ml-auto shrink-0 rounded-sm bg-(--enter-btn-bg) px-1.5 py-0.5 text-xs text-(--primary)">
                        本文
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={`/posts/${post.slug}`}
                      title={`第 ${index + 1} 篇`}
                      aria-label={`第 ${index + 1} 篇`}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-1.5 transition-all hover:bg-black/5 active:scale-[0.98] dark:hover:bg-white/5 ${
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
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

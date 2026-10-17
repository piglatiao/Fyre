"use client";

import { Images, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import type { GalleryAlbum } from "@/types/gallery-album";
import GalleryAlbumCard from "./gallery-album-card";

// 相册列表：关键词搜索、标签筛选与响应式相册卡片网格
export default function GalleryExplorer({ albums }: { albums: GalleryAlbum[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all");

  // 汇总相册标签并按中文顺序排列
  const allTags = useMemo(
    () => [...new Set(albums.flatMap((album) => album.tags))].sort((left, right) => left.localeCompare(right, "zh-CN")),
    [albums],
  );

  // 搜索标题、简介、地点和标签，并叠加标签筛选
  const visibleAlbums = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return albums.filter((album) => {
      const tagMatched = activeTag === "all" || album.tags.includes(activeTag);
      const searchMatched =
        !keyword ||
        album.title.toLowerCase().includes(keyword) ||
        album.description.toLowerCase().includes(keyword) ||
        album.location.toLowerCase().includes(keyword) ||
        album.tags.some((tag) => tag.toLowerCase().includes(keyword));
      return tagMatched && searchMatched;
    });
  }, [activeTag, albums, query]);

  return (
    <div className="flex flex-col">
      <section className="card-base onload-animation mb-4 min-h-32 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
        <div className="page-heading mb-5">
          <div className="page-icon" aria-hidden>
            <Images className="size-8" />
          </div>
          <div>
            <h1>相册</h1>
            <p>记录光影、旅途与值得收藏的瞬间 · {albums.length} 个相册</p>
          </div>
        </div>

        {albums.length > 0 ? (
          <>
            <div className="relative mb-3">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索相册、地点或标签..."
                aria-label="搜索相册"
                className="w-full rounded-xl border border-(--line-divider) bg-transparent py-2.5 pr-4 pl-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-(--primary) focus:ring-1 focus:ring-(--primary) dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />
            </div>

            {allTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-active={activeTag === "all" ? "" : undefined}
                  onClick={() => setActiveTag("all")}
                  aria-pressed={activeTag === "all"}
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
                    aria-pressed={activeTag === tag}
                    className="category-pill px-3 py-1.5 text-sm font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      {albums.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center rounded-(--radius-large) py-16 text-neutral-400 dark:text-neutral-500">
          <Images aria-hidden className="mb-4 size-16 opacity-50" />
          <p className="text-lg">暂无相册</p>
        </div>
      ) : visibleAlbums.length > 0 ? (
        <div className="gallery-grid">
          {visibleAlbums.map((album, index) => (
            <GalleryAlbumCard key={album.id} album={album} animationDelayMs={index * 50} />
          ))}
        </div>
      ) : (
        <div className="card-base flex flex-col items-center justify-center rounded-(--radius-large) py-16 text-neutral-400 dark:text-neutral-500">
          <SearchX aria-hidden className="mb-4 size-16 opacity-50" />
          <p className="text-lg">没有匹配的相册</p>
          <p className="mt-1 text-sm">换个关键词或标签再试试。</p>
        </div>
      )}
    </div>
  );
}

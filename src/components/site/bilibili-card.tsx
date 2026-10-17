"use client";

import { Film, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getBilibiliSeasonTypeMeta } from "@/lib/bilibili-season-type";
import type { BilibiliAnime } from "@/types/bilibili-anime";

// 哔哩哔哩媒体卡片：海报、类型、评分、更新状态与悬停简介
export default function BilibiliCard({
  anime,
  onOpen,
  priority = false,
}: {
  anime: BilibiliAnime;
  onOpen: (anime: BilibiliAnime) => void;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const meta = getBilibiliSeasonTypeMeta(anime.seasonType, anime.seasonTypeName);
  const statusText = anime.epStatus || (anime.isFinished ? "已完结" : anime.releaseDate.slice(0, 4));

  // 缓存图片可能在 React 水合前已加载完成，挂载后主动补齐加载状态
  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete) {
      return;
    }
    if (image.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setFailed(true);
    }
  }, [anime.poster]);

  return (
    <button
      type="button"
      aria-label={`查看《${anime.title}》详情`}
      onClick={() => onOpen(anime)}
      className="media-card card-base group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-(--line-divider) text-left transition duration-300 hover:-translate-y-1 hover:border-(--primary)/30 hover:shadow-lg focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary)"
    >
      <span className="relative block aspect-[2/3] overflow-hidden bg-(--muted)">
        {!failed && anime.poster ? (
          <>
            {!loaded ? <span aria-hidden className="absolute inset-0 animate-pulse bg-(--btn-regular-bg)" /> : null}
            {/* eslint-disable-next-line @next/next/no-img-element -- 哔哩哔哩封面为外部 CDN 地址，需禁用 Referer */}
            <img
              ref={imageRef}
              src={anime.poster}
              alt=""
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={`size-full object-cover transition duration-500 group-hover:scale-110 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <span className="flex size-full items-center justify-center text-neutral-300 dark:text-neutral-600">
            <Film aria-hidden className="size-12" />
          </span>
        )}

        <span className={`absolute top-2 left-2 z-10 rounded-lg px-2 py-1 text-xs font-bold text-white backdrop-blur-sm ${meta.badgeClass}`}>
          {meta.label}
        </span>

        {anime.rating > 0 ? (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
            <Star aria-hidden className="size-3 fill-amber-400 text-amber-400" />
            {anime.rating.toFixed(1)}
          </span>
        ) : null}

        <span className="absolute bottom-2 left-2 z-10 rounded-md bg-pink-500/85 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          Bilibili
        </span>

        <span className="absolute inset-0 z-20 flex flex-col justify-end bg-linear-to-t from-black/85 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="mb-2 line-clamp-3 text-xs leading-relaxed text-white/90">
            {anime.summary || "暂无简介"}
          </span>
          <span className="block w-full rounded-lg bg-(--primary) px-3 py-1.5 text-center text-xs font-medium text-white">
            查看详情
          </span>
        </span>
      </span>

      <span className="block min-w-0 p-3">
        <span className="line-clamp-1 block text-sm font-semibold text-neutral-900 dark:text-neutral-100" title={anime.title}>
          {anime.title}
        </span>
        <span className="mt-1.5 flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="line-clamp-1">{statusText || "暂无更新信息"}</span>
          {anime.progress ? <span className="shrink-0 text-(--primary)">看到 {anime.progress}</span> : null}
        </span>
      </span>
    </button>
  );
}

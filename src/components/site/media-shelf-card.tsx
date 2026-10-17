"use client";

import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MediaShelfItem } from "@/types/media-shelf-item";

const STATUS_TONES: Record<string, string> = {
  wish: "bg-blue-500/90",
  doing: "bg-amber-500/90",
  done: "bg-emerald-500/90",
  "on-hold": "bg-orange-500/90",
  dropped: "bg-rose-500/90",
  unknown: "bg-zinc-500/90",
};

// 通用媒体海报卡：状态、评分、简介与标签叠加在封面之上，点击前往原始条目
export default function MediaShelfCard({
  item,
  blurCover = false,
}: {
  item: MediaShelfItem;
  blurCover?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const scoreText = item.score > 0
    ? Number.isInteger(item.score)
      ? item.score.toFixed(0)
      : item.score.toFixed(1)
    : "";
  const visibleTags = item.tags.slice(0, 2);
  const hiddenTagCount = Math.max(item.tags.length - visibleTags.length, 0);
  const metaText = [item.meta, item.progress].filter(Boolean).join(" · ");

  // 缓存图片可能在水合前完成，挂载后主动同步加载状态
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
  }, [item.cover]);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`查看《${item.title}》详情`}
      className="group relative block overflow-hidden rounded-xl border border-(--line-divider) bg-(--muted) shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary)"
    >
      <span className="relative block aspect-[2/3] overflow-hidden">
        {!failed && item.cover ? (
          <>
            {!loaded ? <span aria-hidden className="absolute inset-0 animate-pulse bg-(--btn-regular-bg)" /> : null}
            {/* eslint-disable-next-line @next/next/no-img-element -- 外部媒体 CDN 需要禁用 Referer 才能稳定加载 */}
            <img
              ref={imageRef}
              src={item.cover}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              style={blurCover ? { filter: "blur(22px)" } : undefined}
              className={`size-full object-cover transition duration-500 ease-out group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <span className="flex size-full items-center justify-center bg-linear-to-br from-(--btn-regular-bg) to-(--muted) px-3 text-center text-lg font-bold text-(--btn-content)">
            {item.categoryLabel}
          </span>
        )}

        <span className={`absolute top-2 left-2 z-10 rounded-full px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm ${STATUS_TONES[item.statusKey] ?? STATUS_TONES.unknown}`}>
          {item.statusLabel}
        </span>

        {scoreText ? (
          <span className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            <Star aria-hidden className="size-3 fill-amber-300 text-amber-300" />
            {scoreText}
          </span>
        ) : null}

        <span className="absolute inset-0 z-[1] bg-linear-to-t from-black/90 via-black/35 to-transparent" />

        <span className="absolute right-0 bottom-0 left-0 z-10 block p-3">
          <span className="line-clamp-2 block text-sm leading-snug font-bold text-white drop-shadow-md">
            {item.title}
          </span>
          {item.subtitle ? (
            <span className="mt-0.5 line-clamp-1 block text-[11px] text-white/60">{item.subtitle}</span>
          ) : null}
          {metaText ? (
            <span className="mt-1 line-clamp-1 block text-[11px] text-white/70">{metaText}</span>
          ) : null}
          {item.communityScore > 0 && item.communityScore !== item.score ? (
            <span className="mt-0.5 block text-[10px] text-white/55">
              {item.scoreLabel} 均分 {item.communityScore.toFixed(1)}
            </span>
          ) : null}
          {visibleTags.length > 0 ? (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {visibleTags.map((tag) => (
                <span key={tag} className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
              {hiddenTagCount > 0 ? (
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] text-white/60 backdrop-blur-sm">
                  +{hiddenTagCount}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      </span>
    </a>
  );
}

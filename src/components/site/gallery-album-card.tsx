"use client";

import { CalendarDays, ChevronRight, Images, LockKeyhole, MapPin, Tag } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { formatDate } from "@/lib/format-date";
import type { GalleryAlbum } from "@/types/gallery-album";

// 相册卡片：封面、照片数量、加密状态、日期、标签、简介与地点
export default function GalleryAlbumCard({
  album,
  animationDelayMs,
}: {
  album: GalleryAlbum;
  animationDelayMs?: number;
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const visibleTags = album.tags.slice(0, 2);
  const hiddenTagCount = album.tags.length - visibleTags.length;
  const animationStyle =
    animationDelayMs === undefined
      ? undefined
      : ({ animationDelay: `calc(var(--content-delay) + ${animationDelayMs}ms)` } as CSSProperties);

  return (
    <article
      className="gallery-album-card card-base onload-animation flex min-w-0 flex-col overflow-hidden rounded-(--radius-large)"
      style={animationStyle}
    >
      <Link
        href={`/gallery/${album.slug}`}
        aria-label={album.title}
        className="group relative mx-4 mt-4 block aspect-2/1 overflow-hidden rounded-xl"
      >
        {album.coverUrl && !coverFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- 封面来自媒体库或外链，保留原始构图
          <img
            src={album.coverUrl}
            alt={album.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition duration-500 group-hover:scale-110"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <span className="flex size-full items-center justify-center bg-(--btn-regular-bg) text-(--primary)/60">
            <Images aria-hidden className="size-16" />
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 z-10 bg-black/0 transition group-hover:bg-black/30" />
        <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <ChevronRight
            aria-hidden
            className="size-10 scale-50 text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100"
          />
        </span>
        <span className="pointer-events-none absolute top-3 right-3 z-30 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
          <Images aria-hidden className="size-3.5" />
          {album.photoCount} 张
        </span>
        {album.encrypted ? (
          <span
            className="pointer-events-none absolute top-3 left-3 z-30 inline-flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md"
            title="加密相册"
          >
            <LockKeyhole aria-hidden className="size-3.5" />
          </span>
        ) : null}
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <Link
          href={`/gallery/${album.slug}`}
          className="line-clamp-1 min-w-0 text-[1.35rem]/[1.75rem] font-bold text-black/90 transition hover:text-(--primary) dark:text-white/90"
        >
          {album.title}
        </Link>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500 dark:text-neutral-400">
          {album.eventDate ? (
            <span className="flex items-center">
              <span className="meta-icon">
                <CalendarDays aria-hidden className="size-4" />
              </span>
              <time dateTime={album.eventDate.toISOString()} className="text-50 text-sm font-medium">
                {formatDate(album.eventDate)}
              </time>
            </span>
          ) : null}
          {visibleTags.length > 0 ? (
            <span className="flex min-w-0 items-center">
              <span className="meta-icon">
                <Tag aria-hidden className="size-4" />
              </span>
              <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
                {visibleTags.map((tag, index) => (
                  <span key={tag} className="flex items-center">
                    {index > 0 ? <span className="mr-1.5 text-(--meta-divider)">/</span> : null}
                    <span className="text-50 whitespace-nowrap">{tag}</span>
                  </span>
                ))}
                {hiddenTagCount > 0 ? <span className="text-50">+{hiddenTagCount}</span> : null}
              </span>
            </span>
          ) : null}
        </div>

        {album.description ? (
          <p
            className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
            title={album.description}
          >
            {album.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-4">
          {album.location ? (
            <span className="text-50 flex min-w-0 items-center gap-1 text-sm font-medium">
              <MapPin aria-hidden className="size-4 shrink-0" />
              <span className="truncate">{album.location}</span>
            </span>
          ) : null}
          <Link
            href={`/gallery/${album.slug}`}
            className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-(--primary) dark:text-neutral-400"
          >
            进入相册
            <ChevronRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

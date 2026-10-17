"use client";

import { ArrowLeft, CalendarDays, Images, LockKeyhole, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// 相册详情横幅：封面、返回入口、标题、简介、日期、地点、照片数与标签
export default function GalleryAlbumHero({
  title,
  description,
  coverUrl,
  dateLabel,
  location,
  photoCount,
  tags,
  encrypted,
}: {
  title: string;
  description: string;
  coverUrl: string;
  dateLabel: string;
  location: string;
  photoCount: number;
  tags: string[];
  encrypted: boolean;
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = coverUrl.length > 0 && !coverFailed;

  return (
    <div className="relative mb-4 aspect-3/1 max-h-90 min-h-50 w-full overflow-hidden rounded-(--radius-large)">
      {showCover ? (
        // eslint-disable-next-line @next/next/no-img-element -- 封面来自媒体库或外链，需要按实际构图裁切
        <img
          src={coverUrl}
          alt={title}
          className="size-full object-cover"
          onError={() => setCoverFailed(true)}
        />
      ) : (
        <div
          className="flex size-full items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 22%, var(--card-bg)), var(--btn-regular-bg))",
          }}
        >
          <Images aria-hidden className="size-20 text-(--primary)/45" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent" />

      <Link
        href="/gallery"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-1.5 text-sm text-white/90 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white"
      >
        <ArrowLeft aria-hidden className="size-4" />
        返回相册
      </Link>
      {encrypted ? (
        <span className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 rounded-lg bg-black/30 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm">
          <LockKeyhole aria-hidden className="size-3.5" />
          加密相册
        </span>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
        <h1 className="mb-2 text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mb-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/75">{description}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
          {dateLabel ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden className="size-4" />
              {dateLabel}
            </span>
          ) : null}
          {location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-4" />
              {location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Images aria-hidden className="size-4" />
            {photoCount} 张照片
          </span>
        </div>
        {tags.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded bg-white/20 px-2 py-0.5 text-xs text-white/90 backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

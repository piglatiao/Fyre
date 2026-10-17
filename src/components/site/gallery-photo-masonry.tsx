"use client";

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { GalleryPhoto } from "@/types/gallery-photo";

// 相册瀑布流：按原图比例排布，点击进入支持键盘切换的灯箱
export default function GalleryPhotoMasonry({ photos }: { photos: GalleryPhoto[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [failedIds, setFailedIds] = useState<Set<number>>(() => new Set());

  // 灯箱键盘操作：Esc 关闭，左右方向键循环切换
  useEffect(() => {
    if (activeIndex === null) {
      return;
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }
      if (photos.length < 2) {
        return;
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((index) => (index === null ? index : (index + 1) % photos.length));
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => (index === null ? index : (index - 1 + photos.length) % photos.length));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400 dark:text-neutral-500">
        <Images aria-hidden className="mb-4 size-16 opacity-50" />
        <p className="text-lg">这个相册还没有照片</p>
      </div>
    );
  }

  const active = activeIndex === null ? null : photos[activeIndex];

  // 图片加载失败时记录编号并展示占位，避免破图标
  function markFailed(id: number): void {
    setFailedIds((current) => new Set(current).add(id));
  }

  return (
    <>
      <div className="gallery-masonry">
        {photos.map((photo, index) => (
          <figure key={photo.id} className="gallery-photo-card mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={photo.caption || `查看第 ${index + 1} 张照片`}
              className="group relative block w-full overflow-hidden rounded-xl bg-(--btn-regular-bg) text-left"
            >
              {failedIds.has(photo.id) ? (
                <span className="flex aspect-4/3 w-full items-center justify-center text-(--primary)/50">
                  <Images aria-hidden className="size-10" />
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- 相册原图尺寸与比例不定，使用原生 img 保持瀑布流布局
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || `相册照片 ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={() => markFailed(photo.id)}
                />
              )}
              {photo.caption ? (
                <>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/70 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 text-xs text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                    {photo.caption}
                  </span>
                </>
              ) : null}
            </button>
          </figure>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption || "照片预览"}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="关闭预览"
            className="absolute top-4 right-4 z-20 flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <X aria-hidden className="size-5" />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="上一张照片"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex((index) => (index === null ? index : (index - 1 + photos.length) % photos.length));
                }}
                className="absolute left-3 z-20 flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:left-6"
              >
                <ChevronLeft aria-hidden className="size-6" />
              </button>
              <button
                type="button"
                aria-label="下一张照片"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex((index) => (index === null ? index : (index + 1) % photos.length));
                }}
                className="absolute right-3 z-20 flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-6"
              >
                <ChevronRight aria-hidden className="size-6" />
              </button>
            </>
          ) : null}

          <div className="flex max-h-[90vh] max-w-[94vw] flex-col items-center" onClick={(event) => event.stopPropagation()}>
            {failedIds.has(active.id) ? (
              <div className="flex size-64 items-center justify-center rounded-lg bg-white/10 text-white/50">
                <Images aria-hidden className="size-16" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- 灯箱按原比例展示相册大图
              <img
                src={active.imageUrl}
                alt={active.caption || "相册照片"}
                className="max-h-[82vh] max-w-[92vw] rounded-lg object-contain"
              />
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-white/80">
              {active.caption ? <span>{active.caption}</span> : null}
              <span>
                {(activeIndex ?? 0) + 1} / {photos.length}
                {photos.length > 1 ? " · 使用 ← → 切换，Esc 关闭" : " · Esc 关闭"}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

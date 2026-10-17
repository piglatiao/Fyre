"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { DynamicImage } from "@/types/dynamic-image";

// 动态配图网格：点击任意图片放大查看，支持 Esc 关闭与左右方向键切换
export default function DynamicGallery({ images }: { images: DynamicImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 键盘操作：Esc 关闭，左右方向键切换
  useEffect(() => {
    if (activeIndex === null) {
      return;
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }
      if (images.length < 2) {
        return;
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((index) => (index === null ? index : (index + 1) % images.length));
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => (index === null ? index : (index - 1 + images.length) % images.length));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, images.length]);

  if (images.length === 0) {
    return null;
  }
  const active = activeIndex === null ? null : images[activeIndex];

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative overflow-hidden rounded-lg"
            aria-label={image.alt || `查看第 ${index + 1} 张图片`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 配图来自媒体库，尺寸不定，使用原生 img 便于保持原比例 */}
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt || "图片预览"}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="关闭预览"
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <X aria-hidden className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- 预览大图按原比例展示 */}
          <img
            src={active.src}
            alt={active.alt}
            className="max-h-[85vh] max-w-[92vw] rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          {images.length > 1 ? (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-white/85">
              {(activeIndex ?? 0) + 1} / {images.length} · 使用 ← → 切换，Esc 关闭
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
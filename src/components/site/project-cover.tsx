"use client";

import { Maximize2, Rocket, X } from "lucide-react";
import { useEffect, useState } from "react";

// 项目封面：加载失败显示火箭占位；详情页可点击放大并支持 Esc 关闭
export default function ProjectCover({
  src,
  alt,
  className = "",
  imageClassName = "",
  expandable = false,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  expandable?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const available = src.trim().length > 0 && !failed;

  // 预览打开时监听 Esc，避免详情页只剩右上角关闭按钮
  useEffect(() => {
    if (!previewOpen) {
      return;
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [previewOpen]);

  if (!available) {
    return (
      <div className={`flex items-center justify-center bg-(--btn-regular-bg) text-neutral-400 dark:text-neutral-500 ${className}`}>
        <Rocket aria-hidden className="size-16 opacity-60" />
      </div>
    );
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- 封面来自后台上传或外链，保留原始尺寸与比例
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`block size-full object-cover ${imageClassName}`}
      onError={() => setFailed(true)}
    />
  );

  return (
    <>
      {expandable ? (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-label={`放大查看 ${alt}`}
          className={`group relative block cursor-zoom-in overflow-hidden ${className}`}
        >
          {image}
          <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
          <span className="pointer-events-none absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
            <Maximize2 aria-hidden className="size-4" />
          </span>
        </button>
      ) : (
        <div className={`relative overflow-hidden ${className}`}>{image}</div>
      )}

      {previewOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} 大图预览`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            aria-label="关闭预览"
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <X aria-hidden className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- 大图预览按原比例展示 */}
          <img
            src={src}
            alt={alt}
            className="max-h-[88vh] max-w-[94vw] rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}

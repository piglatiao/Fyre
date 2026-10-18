"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

// 灯箱图片数据：只保存展示所需的地址与替代文本
interface LightboxImage {
  src: string;
  alt: string;
}

// 读取正文中可放大的图片，排除 Wiki 卡片封面、图表与已有链接包裹的图片
function collectArticleImages(root: HTMLElement): HTMLImageElement[] {
  return Array.from(root.querySelectorAll<HTMLImageElement>("img")).filter(
    (image) =>
      !image.closest(".card-wiki-link") &&
      !image.closest(".diagram-container") &&
      !image.closest("a"),
  );
}

// 文章图片灯箱：支持鼠标、键盘、前后切换、遮罩关闭、焦点恢复与滚动锁定
export default function ArticleImageLightbox({
  containerRef,
  contentKey,
}: {
  containerRef: RefObject<HTMLElement | null>;
  contentKey: string;
}) {
  const [images, setImages] = useState<LightboxImage[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = activeIndex !== null;

  // 为正文图片增加按钮语义与焦点能力，卸载时恢复作者原本设置的属性
  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }

    const restorers: (() => void)[] = [];
    const prepare = (): void => {
      const current = collectArticleImages(root);
      setImages(current.map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt || "文章图片",
      })));
      for (const image of current) {
        if (image.dataset.articleLightboxImage === "true") {
          continue;
        }
        const previousTabIndex = image.getAttribute("tabindex");
        const previousRole = image.getAttribute("role");
        const previousLabel = image.getAttribute("aria-label");
        image.dataset.articleLightboxImage = "true";
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", image.alt ? `查看图片：${image.alt}` : "查看正文图片");
        restorers.push(() => {
          delete image.dataset.articleLightboxImage;
          if (previousTabIndex === null) {
            image.removeAttribute("tabindex");
          } else {
            image.setAttribute("tabindex", previousTabIndex);
          }
          if (previousRole === null) {
            image.removeAttribute("role");
          } else {
            image.setAttribute("role", previousRole);
          }
          if (previousLabel === null) {
            image.removeAttribute("aria-label");
          } else {
            image.setAttribute("aria-label", previousLabel);
          }
        });
      }
    };

    const openFromImage = (image: HTMLImageElement): void => {
      const current = collectArticleImages(root);
      const index = current.indexOf(image);
      if (index < 0) {
        return;
      }
      setImages(current.map((item) => ({
        src: item.currentSrc || item.src,
        alt: item.alt || "文章图片",
      })));
      setActiveIndex(index);
    };

    const handleClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const image = target.closest<HTMLImageElement>('img[data-article-lightbox-image="true"]');
      if (!image || !root.contains(image)) {
        return;
      }
      event.preventDefault();
      openFromImage(image);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement) || target.dataset.articleLightboxImage !== "true") {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFromImage(target);
      }
    };

    prepare();
    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeyDown);
    return () => {
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeyDown);
      for (const restore of restorers) {
        restore();
      }
    };
  }, [containerRef, contentKey]);

  // 灯箱打开期间锁定页面滚动，处理 Esc、方向键与 Tab 焦点循环
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveIndex(null);
        return;
      }
      if (images.length > 1 && event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((index) => (index === null ? index : (index + 1) % images.length));
        return;
      }
      if (images.length > 1 && event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((index) => (index === null ? index : (index - 1 + images.length) % images.length));
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [isOpen, images.length]);

  const active = activeIndex === null ? null : images[activeIndex];
  // 灯箱只能由客户端交互打开，此时 document 一定存在，可直接挂载到 body 避免祖先变换影响定位
  const dialog = active && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={() => setActiveIndex(null)}
        >
          <div
            ref={dialogRef}
            className="flex max-h-[92vh] max-w-[96vw] flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="关闭图片预览"
              title="关闭图片预览"
              className="absolute top-4 right-4 z-20 flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X aria-hidden className="size-5" />
            </button>

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="上一张图片"
                  title="上一张图片（←）"
                  onClick={() => setActiveIndex((index) => (index === null ? index : (index - 1 + images.length) % images.length))}
                  className="absolute top-1/2 left-3 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-6"
                >
                  <ChevronLeft aria-hidden className="size-6" />
                </button>
                <button
                  type="button"
                  aria-label="下一张图片"
                  title="下一张图片（→）"
                  onClick={() => setActiveIndex((index) => (index === null ? index : (index + 1) % images.length))}
                  className="absolute top-1/2 right-3 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6"
                >
                  <ChevronRight aria-hidden className="size-6" />
                </button>
              </>
            ) : null}

            {/* eslint-disable-next-line @next/next/no-img-element -- 灯箱需要按原比例展示 Markdown 中的任意图片地址 */}
            <img
              src={active.src}
              alt={active.alt}
              className="max-h-[82vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-14 text-center text-xs text-white/75">
              <span>{active.alt}</span>
              <span>
                {(activeIndex ?? 0) + 1} / {images.length}
                {images.length > 1 ? " · 使用 ← → 切换，Esc 关闭" : " · Esc 关闭"}
              </span>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return dialog;
}

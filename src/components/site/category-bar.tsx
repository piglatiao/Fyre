"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CategoryItem } from "@/types/category-item";

// 分类条：主页 / 归档入口 + 横向滚动的分类胶囊。
// 两侧渐隐提示只在实际发生横向溢出且仍有内容可滚动时显示：渐隐用不透明卡片色绘制，
// 胶囊未溢出时会把空白区域盖成一块突兀的纯色方块
export default function CategoryBar({
  categories,
  activeSlug,
  archiveCount,
}: {
  categories: CategoryItem[];
  activeSlug?: string;
  archiveCount: number;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    // 依据滚动位置与内容宽度刷新两侧渐隐的显示状态
    const update = (): void => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const left = el.scrollLeft > 4;
      const right = maxScroll - el.scrollLeft > 4;
      setFade((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [categories]);

  return (
    <div className="category-bar card-base onload-animation mb-4 rounded-(--radius-large) p-3">
      <div className="category-bar-inner flex gap-2">
        <Link
          href="/"
          aria-label="主页"
          data-active={activeSlug === undefined ? "" : undefined}
          className="category-pill shrink-0 px-3 py-1.5 text-sm"
        >
          <Home aria-hidden className="size-[1.125rem]" />
        </Link>
        <Link
          href="/archive"
          className="category-pill shrink-0 px-4 py-1.5 text-sm whitespace-nowrap"
        >
          归档
          <span className="pill-count">{archiveCount}</span>
        </Link>
        {categories.length > 0 ? (
          <>
            <span aria-hidden className="h-6 w-px shrink-0 bg-(--line-color)" />
            <div className="relative min-w-0 flex-1">
              {fade.left ? <span aria-hidden className="scroll-fade scroll-fade-left" /> : null}
              <div ref={scrollRef} className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    data-active={activeSlug === category.slug ? "" : undefined}
                    className="category-pill shrink-0 px-4 py-1.5 text-sm whitespace-nowrap"
                  >
                    {category.name}
                    <span className="pill-count">{category.postCount}</span>
                  </Link>
                ))}
              </div>
              {fade.right ? <span aria-hidden className="scroll-fade scroll-fade-right" /> : null}
            </div>
          </>
        ) : null}
        <span aria-hidden className="hidden h-6 w-px shrink-0 bg-(--line-color) md:block" />
        <Link
          href="/categories"
          aria-label="更多分类"
          className="category-pill hidden! shrink-0 gap-1 px-3 py-1.5 text-sm md:inline-flex!"
        >
          更多
          <ChevronRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

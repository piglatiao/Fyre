"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// 生成页码序列：首尾页与当前页附近页码，间隔使用省略号
function buildPageItems(page: number, totalPages: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, totalPages, page - 2, page - 1, page, page + 1, page + 2]);
  const sorted = [...pages].filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
  const items: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const current of sorted) {
    if (previous && current - previous > 1) {
      items.push("ellipsis");
    }
    items.push(current);
    previous = current;
  }
  return items;
}

// 客户端分页：供筛选后的媒体列表使用，支持页码、上一页与下一页
export default function ClientPagination({
  page,
  totalItems,
  pageSize,
  itemLabel,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
  if (totalPages <= 1) {
    return null;
  }

  const itemClass = "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm transition";

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p className="text-50 text-xs">
        共 {totalItems} {itemLabel} · 第 {page} / {totalPages} 页
      </p>

      <div className="hidden items-center gap-1.5 lg:flex">
        <button
          type="button"
          aria-label="上一页"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`${itemClass} btn-plain disabled:pointer-events-none disabled:opacity-40`}
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        {buildPageItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className={`${itemClass} text-30`}>
              …
            </span>
          ) : item === page ? (
            <span
              key={item}
              aria-current="page"
              className={`${itemClass} bg-(--btn-content) font-medium text-white`}
            >
              {item}
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`${itemClass} btn-plain hover:text-(--primary)`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="下一页"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`${itemClass} btn-plain disabled:pointer-events-none disabled:opacity-40`}
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>

      <div className="flex w-full items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-plain h-10 gap-1 rounded-lg px-4 text-sm font-medium disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft aria-hidden className="size-4" />
          上一页
        </button>
        <span className="text-50 text-sm">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-plain h-10 gap-1 rounded-lg px-4 text-sm font-medium disabled:pointer-events-none disabled:opacity-40"
        >
          下一页
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

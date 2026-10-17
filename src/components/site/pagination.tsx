import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// 生成页码序列：首页、末页、当前页 ±1，间隔用省略号占位
function buildPageItems(page: number, totalPages: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
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

// 列表分页导航：桌面显示页码胶囊，移动端显示上一页/下一页
export default function Pagination({
  basePath,
  page,
  totalPages,
  query,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  query?: Record<string, string>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const buildHref = (target: number): string => {
    const search = new URLSearchParams(query);
    if (target > 1) {
      search.set("page", String(target));
    } else {
      search.delete("page");
    }
    const queryString = search.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const itemClass = "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm transition";

  return (
    <nav aria-label="分页导航" className="mt-4 mb-4 flex items-center justify-center">
      {/* 桌面端：页码 */}
      <div className="hidden items-center gap-1.5 lg:flex">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            aria-label="上一页"
            rel="prev"
            className={`${itemClass} btn-plain hover:text-(--primary)`}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </Link>
        ) : (
          <span aria-disabled className={`${itemClass} text-30`}>
            <ChevronLeft aria-hidden className="size-4" />
          </span>
        )}
        {buildPageItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className={`${itemClass} text-30`}>
              …
            </span>
          ) : item === page ? (
            <span key={item} aria-current="page" className={`${itemClass} bg-(--btn-content) font-medium text-white`}>
              {item}
            </span>
          ) : (
            <Link key={item} href={buildHref(item)} className={`${itemClass} btn-plain hover:text-(--primary)`}>
              {item}
            </Link>
          ),
        )}
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            aria-label="下一页"
            rel="next"
            className={`${itemClass} btn-plain hover:text-(--primary)`}
          >
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        ) : (
          <span aria-disabled className={`${itemClass} text-30`}>
            <ChevronRight aria-hidden className="size-4" />
          </span>
        )}
      </div>

      {/* 移动端：上一页 / 页码 / 下一页 */}
      <div className="flex w-full items-center justify-between gap-3 lg:hidden">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            rel="prev"
            className="btn-plain h-10 gap-1 rounded-lg px-4 text-sm font-medium"
          >
            <ChevronLeft aria-hidden className="size-4" />
            上一页
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center gap-1 rounded-lg px-4 text-sm text-30">
            <ChevronLeft aria-hidden className="size-4" />
            上一页
          </span>
        )}
        <span className="text-50 text-sm">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            rel="next"
            className="btn-plain h-10 gap-1 rounded-lg px-4 text-sm font-medium"
          >
            下一页
            <ChevronRight aria-hidden className="size-4" />
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center gap-1 rounded-lg px-4 text-sm text-30">
            下一页
            <ChevronRight aria-hidden className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
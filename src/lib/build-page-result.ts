import type { PageResult } from "@/types/page-result";

// 把仓储的分页查询结果组装为 PageResult，并计算总页数（空列表按 1 页处理）
export function buildPageResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PageResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

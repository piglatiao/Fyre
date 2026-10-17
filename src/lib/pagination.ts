// 前台分页通用工具：统一每页数量与页码解析

// 前台文章列表每页条数
export const POSTS_PER_PAGE = 10;

// 解析 URL 中的 page 参数：缺失或非法时回退到第 1 页
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

import type { DynamicEntry } from "@/types/dynamic-entry";

// 前台动态服务接口
export interface DynamicService {
  // 列表页：按年份与关键词分页查询已发布动态（正文渲染为 HTML），并返回可筛选的年份
  list(params: {
    page: number;
    pageSize: number;
    year?: number;
    keyword?: string;
  }): Promise<{ items: DynamicEntry[]; total: number; years: number[] }>;
  // 首页右栏：最近 N 条已发布动态
  listRecent(limit: number): Promise<DynamicEntry[]>;
  // 已发布总数（右栏「更多动态」计数用）
  count(): Promise<number>;
}
import type { DynamicRecord } from "@/types/dynamic-record";

// 动态仓储接口（前台公开读取）：仅负责数据存取，渲染与聚合在服务层完成
export interface DynamicRepository {
  // 公开分页查询：仅返回发布时间已到的条目；置顶优先、发布时间倒序
  findPublishedPage(params: {
    page: number;
    pageSize: number;
    year?: number;
    keyword?: string;
  }): Promise<{ items: DynamicRecord[]; total: number }>;
  // 首页右栏用：最近 N 条已发布动态
  listRecentPublished(limit: number): Promise<DynamicRecord[]>;
  // 已发布总数
  countPublished(): Promise<number>;
  // 已发布动态覆盖的年份（Asia/Shanghai，降序）
  listPublishedYears(): Promise<number[]>;
}
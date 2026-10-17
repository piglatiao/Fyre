import type { DashboardModuleCounts } from "@/types/dashboard-module-counts";

// 仪表盘统计数据
export interface DashboardStats {
  postTotal: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  privateCount: number;
  categoryCount: number;
  tagCount: number;
  pageCount: number;
  mediaCount: number;
  totalViews: number;
  // 未设置封面的文章数
  coverlessCount: number;
  // 设置了阅读密码的文章数
  encryptedCount: number;
  // 最近一条定时发布时间，没有则为 null
  nextScheduledAt: Date | null;
  // 非文章类内容模块统计
  modules: DashboardModuleCounts;
}

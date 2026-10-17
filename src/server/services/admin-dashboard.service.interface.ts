import type { AdminPostListItem } from "@/types/admin-post-list-item";
import type { DashboardStats } from "@/types/dashboard-stats";
import type { DashboardSystemInfo } from "@/types/dashboard-system-info";
import type { DashboardTrendPoint } from "@/types/dashboard-trend-point";

// 仪表盘服务接口：聚合各模块统计
export interface AdminDashboardService {
  // 统计概览
  getStats(): Promise<DashboardStats>;
  // 最近更新的文章
  listRecentPosts(limit: number): Promise<AdminPostListItem[]>;
  // 最近若干天的发布趋势（含没有发布的日期，按 Asia/Shanghai 聚合）
  getPublishTrend(days: number): Promise<DashboardTrendPoint[]>;
  // 热门文章（按阅读量排序）
  listPopularPosts(limit: number): Promise<AdminPostListItem[]>;
  // 系统信息（运行时环境与存储占用）
  getSystemInfo(): Promise<DashboardSystemInfo>;
}
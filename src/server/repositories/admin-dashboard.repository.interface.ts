import type { DashboardModuleCounts } from "@/types/dashboard-module-counts";

// 仪表盘聚合仓储接口：统一采集跨模块统计
export interface AdminDashboardRepository {
  // 获取动态、项目、相册、友链、书签、打赏与音乐模块数量
  getModuleCounts(): Promise<DashboardModuleCounts>;
}

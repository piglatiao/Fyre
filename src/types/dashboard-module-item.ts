import type { LucideIcon } from "lucide-react";

// 仪表盘模块卡片数据：入口、数量与说明
export interface DashboardModuleItem {
  href: string;
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
}

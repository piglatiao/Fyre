import type { LucideIcon } from "lucide-react";

// 后台导航项：路径、名称与图标统一由配置驱动
export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

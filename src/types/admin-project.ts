import type { ProjectDetail } from "./project-detail";

// 后台项目：补充启停状态、创建与更新时间
export interface AdminProject extends ProjectDetail {
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

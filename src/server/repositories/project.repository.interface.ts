import type { Project } from "@/types/project";
import type { ProjectDetail } from "@/types/project-detail";

// 项目前台仓储接口：仅读取已启用记录
export interface ProjectRepository {
  listEnabled(): Promise<Project[]>;
  findEnabledBySlug(slug: string): Promise<ProjectDetail | null>;
}

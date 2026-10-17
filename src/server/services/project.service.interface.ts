import type { Project } from "@/types/project";
import type { ProjectDetailView } from "@/types/project-detail-view";

// 项目前台服务接口
export interface ProjectService {
  listProjects(): Promise<Project[]>;
  getProjectView(slug: string): Promise<ProjectDetailView | null>;
}

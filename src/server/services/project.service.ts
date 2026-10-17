import { renderMarkdown } from "@/lib/markdown";
import type { ProjectRepository } from "@/server/repositories/project.repository.interface";
import type { Project } from "@/types/project";
import type { ProjectDetailView } from "@/types/project-detail-view";
import type { ProjectService } from "./project.service.interface";

// 项目前台服务默认实现：详情正文统一渲染为安全 HTML
export class DefaultProjectService implements ProjectService {
  constructor(private readonly projects: ProjectRepository) {}

  async listProjects(): Promise<Project[]> {
    return this.projects.listEnabled();
  }

  async getProjectView(slug: string): Promise<ProjectDetailView | null> {
    const project = await this.projects.findEnabledBySlug(slug);
    if (!project) {
      return null;
    }
    const rendered = await renderMarkdown(project.content);
    return { project, html: rendered.html, toc: rendered.toc };
  }
}

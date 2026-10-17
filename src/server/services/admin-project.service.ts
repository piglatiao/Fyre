import { parseOptionalDate } from "@/lib/parse-date";
import type { AdminProjectRepository } from "@/server/repositories/admin-project.repository.interface";
import type { AdminProject } from "@/types/admin-project";
import type { ProjectInput } from "@/types/project-input";
import type { ProjectWriteInput } from "@/types/project-write-input";
import type { AdminProjectService } from "./admin-project.service.interface";
import { ServiceError } from "./service-error";

// 项目后台服务默认实现：校验 slug 唯一性并转换发布日期
export class DefaultAdminProjectService implements AdminProjectService {
  constructor(private readonly projects: AdminProjectRepository) {}

  private toWriteInput(input: ProjectInput): ProjectWriteInput {
    const publishedAt = parseOptionalDate(input.publishedAt);
    if (!publishedAt) {
      throw new ServiceError("invalid_published_at", "发布日期格式不正确");
    }
    return { ...input, publishedAt };
  }

  async listAll(): Promise<AdminProject[]> {
    return this.projects.listAll();
  }

  async create(input: ProjectInput): Promise<{ id: number }> {
    const existing = await this.projects.findBySlug(input.slug);
    if (existing) {
      throw new ServiceError("project_slug_exists", "项目标识已被使用，请换一个 slug");
    }
    return this.projects.create(this.toWriteInput(input));
  }

  async update(id: number, input: ProjectInput): Promise<void> {
    const current = await this.projects.findById(id);
    if (!current) {
      throw new ServiceError("project_not_found", "项目不存在或已被删除");
    }
    const sameSlug = await this.projects.findBySlug(input.slug);
    if (sameSlug && sameSlug.id !== id) {
      throw new ServiceError("project_slug_exists", "项目标识已被使用，请换一个 slug");
    }
    await this.projects.update(id, this.toWriteInput(input));
  }

  async remove(id: number): Promise<void> {
    const current = await this.projects.findById(id);
    if (!current) {
      throw new ServiceError("project_not_found", "项目不存在或已被删除");
    }
    await this.projects.remove(id);
  }
}

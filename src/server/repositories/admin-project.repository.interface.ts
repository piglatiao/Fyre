import type { AdminProject } from "@/types/admin-project";
import type { ProjectWriteInput } from "@/types/project-write-input";

// 项目后台仓储接口
export interface AdminProjectRepository {
  listAll(): Promise<AdminProject[]>;
  findById(id: number): Promise<AdminProject | null>;
  findBySlug(slug: string): Promise<{ id: number } | null>;
  create(input: ProjectWriteInput): Promise<{ id: number }>;
  update(id: number, input: ProjectWriteInput): Promise<void>;
  remove(id: number): Promise<void>;
}

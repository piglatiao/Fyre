import type { AdminProject } from "@/types/admin-project";
import type { ProjectInput } from "@/types/project-input";

// 项目后台服务接口
export interface AdminProjectService {
  listAll(): Promise<AdminProject[]>;
  create(input: ProjectInput): Promise<{ id: number }>;
  update(id: number, input: ProjectInput): Promise<void>;
  remove(id: number): Promise<void>;
}

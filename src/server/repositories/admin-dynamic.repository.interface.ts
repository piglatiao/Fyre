import type { AdminDynamicEntry } from "@/types/admin-dynamic-entry";
import type { DynamicWriteInput } from "@/types/dynamic-write-input";

// 动态仓储接口（后台）：仅负责数据存取，业务规则由 AdminDynamicService 处理
export interface AdminDynamicRepository {
  // 后台分页列表：置顶优先、发布时间倒序
  findPage(params: { page: number; pageSize: number }): Promise<{ items: AdminDynamicEntry[]; total: number }>;
  // 按 id 查询（编辑器回填）
  findById(id: number): Promise<AdminDynamicEntry | null>;
  // 新建动态
  create(input: DynamicWriteInput): Promise<{ id: number }>;
  // 更新动态
  update(id: number, input: DynamicWriteInput): Promise<void>;
  // 删除动态
  remove(id: number): Promise<void>;
}
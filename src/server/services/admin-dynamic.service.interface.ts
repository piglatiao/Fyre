import type { AdminDynamicEntry } from "@/types/admin-dynamic-entry";
import type { DynamicUpsertInput } from "@/types/dynamic-upsert-input";

// 后台动态服务接口
export interface AdminDynamicService {
  // 分页列表（置顶优先、发布时间倒序）
  list(params: { page: number; pageSize: number }): Promise<{ items: AdminDynamicEntry[]; total: number }>;
  // 单条详情（编辑器回填）
  getById(id: number): Promise<AdminDynamicEntry | null>;
  // 新建动态
  create(input: DynamicUpsertInput): Promise<{ id: number }>;
  // 更新动态
  update(id: number, input: DynamicUpsertInput): Promise<void>;
  // 删除动态
  remove(id: number): Promise<void>;
}
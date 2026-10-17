import type { TagItem } from "@/types/tag-item";
import type { TagUpsertInput } from "@/types/tag-upsert-input";

// 后台标签仓储接口：标签增删改查与合并
export interface AdminTagRepository {
  // 全部标签及文章数量
  listWithCounts(): Promise<TagItem[]>;
  // 按 id 查询
  findById(id: number): Promise<TagItem | null>;
  // slug 是否已存在（编辑时排除自身）
  slugExists(slug: string, excludeId?: number): Promise<boolean>;
  // 名称是否已存在（编辑时排除自身）
  nameExists(name: string, excludeId?: number): Promise<boolean>;
  // 新建标签
  create(input: TagUpsertInput): Promise<{ id: number }>;
  // 更新标签
  update(id: number, input: TagUpsertInput): Promise<void>;
  // 删除标签
  remove(id: number): Promise<void>;
  // 标签总数
  countAll(): Promise<number>;
  // 合并标签：把 source 的关联迁移到 target 后删除 source
  merge(sourceId: number, targetId: number): Promise<void>;
}

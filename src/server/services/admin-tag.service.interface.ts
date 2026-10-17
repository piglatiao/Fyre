import type { TagItem } from "@/types/tag-item";
import type { TagUpsertInput } from "@/types/tag-upsert-input";

// 后台标签服务接口：封装名称唯一性与合并规则
export interface AdminTagService {
  // 全部标签及文章数量
  list(): Promise<TagItem[]>;
  // 新建
  create(input: TagUpsertInput): Promise<{ id: number }>;
  // 更新
  update(id: number, input: TagUpsertInput): Promise<void>;
  // 删除
  remove(id: number): Promise<void>;
  // 合并：把 source 的关联迁移到 target 后删除 source
  merge(sourceId: number, targetId: number): Promise<void>;
}

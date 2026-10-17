import type { AdminCategoryItem } from "@/types/admin-category-item";
import type { CategoryUpsertInput } from "@/types/category-upsert-input";

// 后台分类服务接口：封装 slug 生成与非空删除迁移规则
export interface AdminCategoryService {
  // 全部分类及文章数量
  list(): Promise<AdminCategoryItem[]>;
  // 新建
  create(input: CategoryUpsertInput): Promise<{ id: number }>;
  // 更新
  update(id: number, input: CategoryUpsertInput): Promise<void>;
  // 删除：targetCategoryId 为 undefined 表示不迁移；为 null 表示迁移到无分类
  remove(id: number, targetCategoryId: number | null | undefined): Promise<{ movedPosts: number }>;
}

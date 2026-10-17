import type { AdminCategoryItem } from "@/types/admin-category-item";
import type { CategoryUpsertInput } from "@/types/category-upsert-input";

// 后台分类仓储接口：分类增删改查与文章迁移
export interface AdminCategoryRepository {
  // 全部分类及文章数量
  listWithCounts(): Promise<AdminCategoryItem[]>;
  // 按 id 查询
  findById(id: number): Promise<AdminCategoryItem | null>;
  // slug 是否已存在（编辑时排除自身）
  slugExists(slug: string, excludeId?: number): Promise<boolean>;
  // 新建分类
  create(input: CategoryUpsertInput): Promise<{ id: number }>;
  // 更新分类
  update(id: number, input: CategoryUpsertInput): Promise<void>;
  // 删除分类
  remove(id: number): Promise<void>;
  // 统计分类下文章数量
  countPosts(categoryId: number): Promise<number>;
  // 把文章迁移到目标分类（null 表示置空），返回迁移数量
  reassignPosts(fromCategoryId: number, toCategoryId: number | null): Promise<number>;
  // 分类总数
  countAll(): Promise<number>;
}

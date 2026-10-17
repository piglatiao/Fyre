import type { CategoryInfo } from "@/types/category-info";
import type { CategoryItem } from "@/types/category-item";

// 分类仓储接口
export interface CategoryRepository {
  // 按 slug 查询分类
  findBySlug(slug: string): Promise<CategoryInfo | null>;
  // 全部分类及其已发布文章数量（侧栏与分类条使用）
  listAllWithCounts(): Promise<CategoryItem[]>;
  // sitemap 用：全部分类的 slug
  listAllSlugs(): Promise<string[]>;
}

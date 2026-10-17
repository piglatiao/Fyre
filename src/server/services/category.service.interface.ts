import type { CategoryInfo } from "@/types/category-info";
import type { CategoryItem } from "@/types/category-item";

// 分类服务接口
export interface CategoryService {
  // 按 slug 获取分类信息
  getBySlug(slug: string): Promise<CategoryInfo | null>;
  // 全部分类及其已发布文章数量
  listAllWithCounts(): Promise<CategoryItem[]>;
  // sitemap 用：全部分类 slug
  listAllSlugs(): Promise<string[]>;
}

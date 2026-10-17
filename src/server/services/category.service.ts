import type { CategoryRepository } from "@/server/repositories/category.repository.interface";
import type { CategoryInfo } from "@/types/category-info";
import type { CategoryItem } from "@/types/category-item";
import type { CategoryService } from "./category.service.interface";

// 分类服务默认实现
export class DefaultCategoryService implements CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async getBySlug(slug: string): Promise<CategoryInfo | null> {
    return this.categories.findBySlug(slug);
  }

  async listAllSlugs(): Promise<string[]> {
    return this.categories.listAllSlugs();
  }

  async listAllWithCounts(): Promise<CategoryItem[]> {
    return this.categories.listAllWithCounts();
  }
}

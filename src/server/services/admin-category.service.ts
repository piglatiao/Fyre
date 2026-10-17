import { generateNamedSlug, normalizeSlug, SLUG_MAX_ATTEMPTS } from "@/lib/slug";
import type { AdminCategoryRepository } from "@/server/repositories/admin-category.repository.interface";
import type { AdminCategoryItem } from "@/types/admin-category-item";
import type { CategoryUpsertInput } from "@/types/category-upsert-input";
import type { AdminCategoryService } from "./admin-category.service.interface";
import { ServiceError } from "./service-error";

// 后台分类服务默认实现
export class DefaultAdminCategoryService implements AdminCategoryService {
  constructor(private readonly categories: AdminCategoryRepository) {}

  async list(): Promise<AdminCategoryItem[]> {
    return this.categories.listWithCounts();
  }

  async create(input: CategoryUpsertInput): Promise<{ id: number }> {
    const slug = await this.resolveSlug(input.slug, input.name);
    return this.categories.create({ ...input, slug });
  }

  async update(id: number, input: CategoryUpsertInput): Promise<void> {
    const existed = await this.categories.findById(id);
    if (!existed) {
      throw new ServiceError("category_not_found", "分类不存在或已被删除");
    }
    const slug = await this.resolveSlug(input.slug, input.name, id);
    await this.categories.update(id, { ...input, slug });
  }

  async remove(id: number, targetCategoryId: number | null | undefined): Promise<{ movedPosts: number }> {
    const existed = await this.categories.findById(id);
    if (!existed) {
      throw new ServiceError("category_not_found", "分类不存在或已被删除");
    }
    if (targetCategoryId === id) {
      throw new ServiceError("invalid_target", "目标分类不能是自身");
    }
    const postCount = await this.categories.countPosts(id);
    if (postCount > 0) {
      if (targetCategoryId === undefined) {
        throw new ServiceError("category_not_empty", "该分类下仍有文章，请先转移文章或指定迁移目标");
      }
      if (targetCategoryId !== null) {
        const target = await this.categories.findById(targetCategoryId);
        if (!target) {
          throw new ServiceError("target_not_found", "目标分类不存在");
        }
      }
    }
    const movedPosts =
      targetCategoryId === undefined ? 0 : await this.categories.reassignPosts(id, targetCategoryId);
    await this.categories.remove(id);
    return { movedPosts };
  }

  // slug 处理：手填优先且查重，留空按名称规范化生成
  private async resolveSlug(raw: string, name: string, excludeId?: number): Promise<string> {
    const normalized = normalizeSlug(raw);
    if (normalized) {
      if (await this.categories.slugExists(normalized, excludeId)) {
        throw new ServiceError("slug_conflict", "该 slug 已被使用，请更换");
      }
      return normalized;
    }
    const base = normalizeSlug(name);
    if (base && !(await this.categories.slugExists(base, excludeId))) {
      return base;
    }
    for (let attempt = 0; attempt < SLUG_MAX_ATTEMPTS; attempt += 1) {
      const candidate = generateNamedSlug(name);
      if (!(await this.categories.slugExists(candidate, excludeId))) {
        return candidate;
      }
    }
    throw new ServiceError("slug_generate_failed", "自动生成 slug 失败，请手动填写");
  }
}

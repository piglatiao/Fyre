import { generateNamedSlug, normalizeSlug, SLUG_MAX_ATTEMPTS } from "@/lib/slug";
import type { AdminPageRepository } from "@/server/repositories/admin-page.repository.interface";
import type { AdminPageDetail } from "@/types/admin-page-detail";
import type { AdminPageItem } from "@/types/admin-page-item";
import type { PageUpsertInput } from "@/types/page-upsert-input";
import type { AdminPageService } from "./admin-page.service.interface";
import { ServiceError } from "./service-error";

// 后台页面服务默认实现
export class DefaultAdminPageService implements AdminPageService {
  constructor(private readonly pages: AdminPageRepository) {}

  async list(): Promise<AdminPageItem[]> {
    return this.pages.listAll();
  }

  async getById(id: number): Promise<AdminPageDetail | null> {
    return this.pages.findById(id);
  }

  async create(input: PageUpsertInput): Promise<{ id: number }> {
    const slug = await this.resolveSlug(input.slug, input.title);
    return this.pages.create({ ...input, slug });
  }

  async update(id: number, input: PageUpsertInput): Promise<void> {
    const existed = await this.pages.findById(id);
    if (!existed) {
      throw new ServiceError("page_not_found", "页面不存在或已被删除");
    }
    const slug = await this.resolveSlug(input.slug, input.title, id);
    await this.pages.update(id, { ...input, slug });
  }

  async remove(id: number): Promise<void> {
    const existed = await this.pages.findById(id);
    if (!existed) {
      throw new ServiceError("page_not_found", "页面不存在或已被删除");
    }
    await this.pages.remove(id);
  }

  // slug 处理：手填优先且查重，留空按标题规范化生成
  private async resolveSlug(raw: string, title: string, excludeId?: number): Promise<string> {
    const normalized = normalizeSlug(raw);
    if (normalized) {
      if (await this.pages.slugExists(normalized, excludeId)) {
        throw new ServiceError("slug_conflict", "该 slug 已被使用，请更换");
      }
      return normalized;
    }
    const base = normalizeSlug(title);
    if (base && !(await this.pages.slugExists(base, excludeId))) {
      return base;
    }
    for (let attempt = 0; attempt < SLUG_MAX_ATTEMPTS; attempt += 1) {
      const candidate = generateNamedSlug(title);
      if (!(await this.pages.slugExists(candidate, excludeId))) {
        return candidate;
      }
    }
    throw new ServiceError("slug_generate_failed", "自动生成 slug 失败，请手动填写");
  }
}

import { generateNamedSlug, normalizeSlug, SLUG_MAX_ATTEMPTS } from "@/lib/slug";
import type { AdminTagRepository } from "@/server/repositories/admin-tag.repository.interface";
import type { TagItem } from "@/types/tag-item";
import type { TagUpsertInput } from "@/types/tag-upsert-input";
import type { AdminTagService } from "./admin-tag.service.interface";
import { ServiceError } from "./service-error";

// 后台标签服务默认实现
export class DefaultAdminTagService implements AdminTagService {
  constructor(private readonly tags: AdminTagRepository) {}

  async list(): Promise<TagItem[]> {
    return this.tags.listWithCounts();
  }

  async create(input: TagUpsertInput): Promise<{ id: number }> {
    if (await this.tags.nameExists(input.name)) {
      throw new ServiceError("tag_name_conflict", "标签名称已存在");
    }
    const slug = await this.resolveSlug(input.slug, input.name);
    return this.tags.create({ ...input, slug });
  }

  async update(id: number, input: TagUpsertInput): Promise<void> {
    const existed = await this.tags.findById(id);
    if (!existed) {
      throw new ServiceError("tag_not_found", "标签不存在或已被删除");
    }
    if (await this.tags.nameExists(input.name, id)) {
      throw new ServiceError("tag_name_conflict", "标签名称已存在");
    }
    const slug = await this.resolveSlug(input.slug, input.name, id);
    await this.tags.update(id, { ...input, slug });
  }

  async remove(id: number): Promise<void> {
    const existed = await this.tags.findById(id);
    if (!existed) {
      throw new ServiceError("tag_not_found", "标签不存在或已被删除");
    }
    await this.tags.remove(id);
  }

  async merge(sourceId: number, targetId: number): Promise<void> {
    if (sourceId === targetId) {
      throw new ServiceError("invalid_target", "待合并标签与目标标签不能相同");
    }
    const [source, target] = await Promise.all([
      this.tags.findById(sourceId),
      this.tags.findById(targetId),
    ]);
    if (!source) {
      throw new ServiceError("tag_not_found", "待合并标签不存在");
    }
    if (!target) {
      throw new ServiceError("target_not_found", "目标标签不存在");
    }
    await this.tags.merge(sourceId, targetId);
  }

  // slug 处理：手填优先且查重，留空按名称规范化生成
  private async resolveSlug(raw: string, name: string, excludeId?: number): Promise<string> {
    const normalized = normalizeSlug(raw);
    if (normalized) {
      if (await this.tags.slugExists(normalized, excludeId)) {
        throw new ServiceError("slug_conflict", "该 slug 已被使用，请更换");
      }
      return normalized;
    }
    const base = normalizeSlug(name);
    if (base && !(await this.tags.slugExists(base, excludeId))) {
      return base;
    }
    for (let attempt = 0; attempt < SLUG_MAX_ATTEMPTS; attempt += 1) {
      const candidate = generateNamedSlug(name);
      if (!(await this.tags.slugExists(candidate, excludeId))) {
        return candidate;
      }
    }
    throw new ServiceError("slug_generate_failed", "自动生成 slug 失败，请手动填写");
  }
}

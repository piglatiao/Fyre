import { PostStatus } from "@/generated/prisma/client";
import { hash } from "bcryptjs";
import { buildPageResult } from "@/lib/build-page-result";
import { generatePostSlug, normalizeSlug, SLUG_MAX_ATTEMPTS } from "@/lib/slug";
import type { AdminPostRepository } from "@/server/repositories/admin-post.repository.interface";
import type { AdminPostDetail } from "@/types/admin-post-detail";
import type { AdminPostListItem } from "@/types/admin-post-list-item";
import type { PageResult } from "@/types/page-result";
import type { PostUpsertInput } from "@/types/post-upsert-input";
import type { PostWriteInput } from "@/types/post-write-input";
import type { AdminPostService } from "./admin-post.service.interface";
import { ServiceError } from "./service-error";

// bcrypt 加密强度：与账号密码保持一致
const BCRYPT_ROUNDS = 10;

// 后台文章服务默认实现
export class DefaultAdminPostService implements AdminPostService {
  constructor(private readonly posts: AdminPostRepository) {}

  async list(params: {
    page: number;
    pageSize: number;
    status?: PostStatus;
    keyword?: string;
  }): Promise<PageResult<AdminPostListItem>> {
    const result = await this.posts.findPage(params);
    return buildPageResult(result.items, result.total, params.page, params.pageSize);
  }

  async getById(id: number): Promise<AdminPostDetail | null> {
    return this.posts.findById(id);
  }

  async create(input: PostUpsertInput): Promise<{ id: number }> {
    const slug = await this.resolveSlug(input.slug);
    const passwordHash = await this.resolvePasswordHash(input, null);
    return this.posts.create(this.toWriteInput(input, slug, passwordHash));
  }

  async update(id: number, input: PostUpsertInput): Promise<void> {
    const existed = await this.posts.findById(id);
    if (!existed) {
      throw new ServiceError("post_not_found", "文章不存在或已被删除");
    }
    const slug = await this.resolveSlug(input.slug, id);
    const passwordHash = await this.resolvePasswordHash(input, id);
    await this.posts.update(id, this.toWriteInput(input, slug, passwordHash));
  }

  async removeMany(ids: number[]): Promise<number> {
    if (ids.length === 0) {
      throw new ServiceError("empty_selection", "请选择要删除的文章");
    }
    return this.posts.deleteMany(ids);
  }

  // slug 处理：手填优先且查重；留空自动生成 post-YYYYMMDD-xxxx
  private async resolveSlug(raw: string, excludeId?: number): Promise<string> {
    const normalized = normalizeSlug(raw);
    if (normalized) {
      if (await this.posts.slugExists(normalized, excludeId)) {
        throw new ServiceError("slug_conflict", "该 slug 已被使用，请更换");
      }
      return normalized;
    }
    for (let attempt = 0; attempt < SLUG_MAX_ATTEMPTS; attempt += 1) {
      const candidate = generatePostSlug(new Date());
      if (!(await this.posts.slugExists(candidate))) {
        return candidate;
      }
    }
    throw new ServiceError("slug_generate_failed", "自动生成 slug 失败，请手动填写");
  }

  // 密码处理：开启加密时必须有新密码或沿用已有密码；关闭加密时清除
  private async resolvePasswordHash(input: PostUpsertInput, existingId: number | null): Promise<string | null> {
    if (!input.encrypted) {
      return null;
    }
    const password = input.password?.trim() ?? "";
    if (password) {
      return await hash(password, BCRYPT_ROUNDS);
    }
    if (existingId !== null) {
      const existing = await this.posts.getPasswordHash(existingId);
      if (existing) {
        return existing;
      }
    }
    throw new ServiceError("password_required", "启用密码保护需要设置访问密码");
  }

  // 状态规则：定时必须填发布时间；已发布补齐发布时间；非定时状态清空定时时间
  private toWriteInput(input: PostUpsertInput, slug: string, passwordHash: string | null): PostWriteInput {
    const base: PostWriteInput = {
      title: input.title,
      slug,
      content: input.content,
      excerpt: input.excerpt,
      coverUrl: input.coverUrl,
      status: input.status,
      pinned: input.pinned,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
      publishedAt: input.publishedAt,
      scheduledAt: input.scheduledAt,
      categoryId: input.categoryId,
      tagIds: input.tagIds,
      series: input.series,
      encrypted: input.encrypted,
      passwordHash,
    };
    if (input.status === PostStatus.SCHEDULED) {
      if (!input.scheduledAt) {
        throw new ServiceError("scheduled_at_required", "定时发布需要设置发布时间");
      }
      return base;
    }
    if (input.status === PostStatus.PUBLISHED) {
      return { ...base, publishedAt: input.publishedAt ?? new Date(), scheduledAt: null };
    }
    return { ...base, scheduledAt: null };
  }
}

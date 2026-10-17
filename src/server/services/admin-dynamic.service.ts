import { parseOptionalDate } from "@/lib/parse-date";
import type { AdminDynamicRepository } from "@/server/repositories/admin-dynamic.repository.interface";
import type { AdminDynamicEntry } from "@/types/admin-dynamic-entry";
import type { DynamicUpsertInput } from "@/types/dynamic-upsert-input";
import type { DynamicWriteInput } from "@/types/dynamic-write-input";
import type { AdminDynamicService } from "./admin-dynamic.service.interface";
import { ServiceError } from "./service-error";

// 后台动态服务默认实现：校验业务规则并规范化为仓储写入数据
export class DefaultAdminDynamicService implements AdminDynamicService {
  constructor(private readonly dynamics: AdminDynamicRepository) {}

  // 发布时间留空时取当前时间；非法格式直接报错（未来时间允许保存，前台到点才可见）
  private toWriteInput(input: DynamicUpsertInput): DynamicWriteInput {
    const publishedAt = input.publishedAt ? parseOptionalDate(input.publishedAt) : new Date();
    if (!publishedAt) {
      throw new ServiceError("invalid_published_at", "发布时间格式不正确");
    }
    return {
      content: input.content,
      images: input.images,
      location: input.location,
      pinned: input.pinned,
      publishedAt,
    };
  }

  async list(params: { page: number; pageSize: number }): Promise<{ items: AdminDynamicEntry[]; total: number }> {
    return this.dynamics.findPage(params);
  }

  async getById(id: number): Promise<AdminDynamicEntry | null> {
    return this.dynamics.findById(id);
  }

  async create(input: DynamicUpsertInput): Promise<{ id: number }> {
    return this.dynamics.create(this.toWriteInput(input));
  }

  async update(id: number, input: DynamicUpsertInput): Promise<void> {
    const existing = await this.dynamics.findById(id);
    if (!existing) {
      throw new ServiceError("dynamic_not_found", "动态不存在或已被删除");
    }
    await this.dynamics.update(id, this.toWriteInput(input));
  }

  async remove(id: number): Promise<void> {
    const existing = await this.dynamics.findById(id);
    if (!existing) {
      throw new ServiceError("dynamic_not_found", "动态不存在或已被删除");
    }
    await this.dynamics.remove(id);
  }
}
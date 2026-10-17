import { renderMarkdown } from "@/lib/markdown";
import type { DynamicRepository } from "@/server/repositories/dynamic.repository.interface";
import type { DynamicEntry } from "@/types/dynamic-entry";
import type { DynamicRecord } from "@/types/dynamic-record";
import type { DynamicService } from "./dynamic.service.interface";

// 前台动态服务默认实现：正文渲染复用文章同一套 unified 链路（白名单过滤防 XSS）
export class DefaultDynamicService implements DynamicService {
  constructor(private readonly dynamics: DynamicRepository) {}

  // 仓储记录渲染为前台条目
  private async toEntry(record: DynamicRecord): Promise<DynamicEntry> {
    const rendered = await renderMarkdown(record.content);
    return {
      id: record.id,
      html: rendered.html,
      images: record.images,
      location: record.location,
      pinned: record.pinned,
      publishedAt: record.publishedAt,
    };
  }

  async list(params: {
    page: number;
    pageSize: number;
    year?: number;
    keyword?: string;
  }): Promise<{ items: DynamicEntry[]; total: number; years: number[] }> {
    const [pageResult, years] = await Promise.all([
      this.dynamics.findPublishedPage(params),
      this.dynamics.listPublishedYears(),
    ]);
    const items = await Promise.all(pageResult.items.map((item) => this.toEntry(item)));
    return { items, total: pageResult.total, years };
  }

  async listRecent(limit: number): Promise<DynamicEntry[]> {
    const records = await this.dynamics.listRecentPublished(limit);
    return Promise.all(records.map((record) => this.toEntry(record)));
  }

  async count(): Promise<number> {
    return this.dynamics.countPublished();
  }
}
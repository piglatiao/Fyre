import type { CustomPage } from "@/types/custom-page";

// 自定义页面仓储接口
export interface PageRepository {
  // 按 slug 查询已发布的自定义页面
  findPublishedBySlug(slug: string): Promise<CustomPage | null>;
  // sitemap 用：全部已发布页面的 slug 与更新时间
  listPublished(): Promise<{ slug: string; updatedAt: Date }[]>;
}

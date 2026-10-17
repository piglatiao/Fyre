import type { CustomPageView } from "@/types/custom-page-view";

// 自定义页面服务接口
export interface PageService {
  // 按 slug 获取已发布页面（含渲染结果）
  getPublishedBySlug(slug: string): Promise<CustomPageView | null>;
  // sitemap 用：全部已发布页面的 slug 与更新时间
  listPublishedEntries(): Promise<{ slug: string; updatedAt: Date }[]>;
}

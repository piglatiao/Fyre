import { formatMonthDay } from "@/lib/format-date";
import { getRuntimeInfo } from "@/lib/system-info";
import type { AdminCategoryRepository } from "@/server/repositories/admin-category.repository.interface";
import type { AdminDashboardRepository } from "@/server/repositories/admin-dashboard.repository.interface";
import type { AdminMediaRepository } from "@/server/repositories/admin-media.repository.interface";
import type { AdminPageRepository } from "@/server/repositories/admin-page.repository.interface";
import type { AdminPostRepository } from "@/server/repositories/admin-post.repository.interface";
import type { AdminTagRepository } from "@/server/repositories/admin-tag.repository.interface";
import type { AdminSystemRepository } from "@/server/repositories/admin-system.repository.interface";
import type { AdminPostListItem } from "@/types/admin-post-list-item";
import type { DashboardStats } from "@/types/dashboard-stats";
import type { DashboardSystemInfo } from "@/types/dashboard-system-info";
import type { DashboardTrendPoint } from "@/types/dashboard-trend-point";
import type { AdminDashboardService } from "./admin-dashboard.service.interface";

// 一天的毫秒数（趋势按天回推）
const DAY_MS = 24 * 60 * 60 * 1000;

// 仪表盘服务默认实现：并行聚合各仓储统计
export class DefaultAdminDashboardService implements AdminDashboardService {
  constructor(
    private readonly posts: AdminPostRepository,
    private readonly categories: AdminCategoryRepository,
    private readonly tags: AdminTagRepository,
    private readonly pages: AdminPageRepository,
    private readonly media: AdminMediaRepository,
    private readonly system: AdminSystemRepository,
    private readonly dashboard: AdminDashboardRepository,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const [
      statusCounts,
      categoryCount,
      tagCount,
      pageCount,
      mediaCount,
      totalViews,
      coverlessCount,
      encryptedCount,
      nextScheduledAt,
      modules,
    ] = await Promise.all([
      this.posts.countByStatus(),
      this.categories.countAll(),
      this.tags.countAll(),
      this.pages.countAll(),
      this.media.countAll(),
      this.posts.sumViews(),
      this.posts.countWithoutCover(),
      this.posts.countEncrypted(),
      this.posts.findNextScheduledAt(),
      this.dashboard.getModuleCounts(),
    ]);
    return {
      postTotal:
        statusCounts.DRAFT + statusCounts.SCHEDULED + statusCounts.PUBLISHED + statusCounts.PRIVATE,
      publishedCount: statusCounts.PUBLISHED,
      draftCount: statusCounts.DRAFT,
      scheduledCount: statusCounts.SCHEDULED,
      privateCount: statusCounts.PRIVATE,
      categoryCount,
      tagCount,
      pageCount,
      mediaCount,
      totalViews,
      coverlessCount,
      encryptedCount,
      nextScheduledAt,
      modules,
    };
  }

  async listRecentPosts(limit: number): Promise<AdminPostListItem[]> {
    return this.posts.listRecent(limit);
  }

  async getPublishTrend(days: number): Promise<DashboardTrendPoint[]> {
    const now = Date.now();
    const dates = await this.posts.listPublishedSince(new Date(now - (days - 1) * DAY_MS));
    const counts = new Map<string, number>();
    for (const date of dates) {
      const label = formatMonthDay(date);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const points: DashboardTrendPoint[] = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const label = formatMonthDay(new Date(now - offset * DAY_MS));
      points.push({ label, count: counts.get(label) ?? 0 });
    }
    return points;
  }

  async listPopularPosts(limit: number): Promise<AdminPostListItem[]> {
    return this.posts.listTopViewed(limit);
  }

  async getSystemInfo(): Promise<DashboardSystemInfo> {
    const [databaseBytes, mediaUsage] = await Promise.all([
      this.system.getDatabaseBytes(),
      this.system.getMediaUsage(),
    ]);
    return {
      ...getRuntimeInfo(),
      databaseBytes,
      mediaFiles: mediaUsage.files,
      mediaBytes: mediaUsage.bytes,
    };
  }
}

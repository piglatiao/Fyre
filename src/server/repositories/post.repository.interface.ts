import type { AdjacentPosts } from "@/types/adjacent-posts";
import type { ArchiveEntry } from "@/types/archive-entry";
import type { PostDetail } from "@/types/post-detail";
import type { PostSummary } from "@/types/post-summary";
import type { SearchHit } from "@/types/search-hit";
import type { SeriesSummary } from "@/types/series-summary";
import type { SiteStats } from "@/types/site-stats";

// 文章仓储接口：仅负责数据存取，业务规则由 PostService 处理
export interface PostRepository {
  // 定时发布落地：把到期的 SCHEDULED 文章转为 PUBLISHED，返回处理数量
  publishDuePosts(now: Date): Promise<number>;
  // 分页查询已发布文章（可按分类或标签过滤）
  findPublishedPage(
    page: number,
    pageSize: number,
    filter?: { categorySlug?: string; tagSlug?: string },
  ): Promise<{ items: PostSummary[]; total: number }>;
  // 按 slug 查询已发布文章详情
  findPublishedDetailBySlug(slug: string): Promise<PostDetail | null>;
  // 解密用：按 id 查询已发布加密文章的 slug 与密码哈希
  findPublishedPasswordHash(id: number): Promise<{ slug: string; passwordHash: string | null } | null>;
  // 前台文章页用：按 slug 查询加密状态（判断是否需要解锁）
  findPublishedUnlockStateBySlug(slug: string): Promise<{ id: number; encrypted: boolean; passwordHash: string | null } | null>;
  // 查询上下篇：prev 为更新的一篇，next 为更旧的一篇
  findNeighbors(publishedAt: Date): Promise<AdjacentPosts>;
  // 阅读数自增并返回最新值
  incrementViewCount(id: number): Promise<number>;
  // 归档用：全部已发布文章的精简条目
  listPublishedEntries(): Promise<ArchiveEntry[]>;
  // 站内搜索：标题/摘要/正文模糊匹配
  searchPublished(keyword: string, limit: number): Promise<SearchHit[]>;
  // 文章页「相关文章」：按同标签/同分类的相关度推荐已发布文章（不足时以最新文章补齐）
  listRelatedPublished(params: {
    excludeSlug: string;
    categorySlug: string | null;
    tagSlugs: string[];
    limit: number;
  }): Promise<PostSummary[]>;
  // 系列总览：全部已发布系列及其文章，按系列名倒序、系列内按发布时间升序
  listPublishedSeries(): Promise<SeriesSummary[]>;
  // 系列导航：指定系列下的全部已发布文章，按发布时间升序编号
  listPublishedBySeries(series: string): Promise<PostSummary[]>;
  // sitemap 用：全部已发布文章的 slug 与更新时间
  listPublishedForSitemap(): Promise<{ slug: string; updatedAt: Date }[]>;
  // RSS 用：最近发布的文章（含正文）
  listRecentPublished(limit: number): Promise<PostDetail[]>;
  // 侧栏统计：已发布文章数、分类数、标签数、总阅读量与最近更新时间
  findSiteStats(): Promise<SiteStats>;
}

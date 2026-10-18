import type { ArchiveGroup } from "@/types/archive-group";
import type { PageResult } from "@/types/page-result";
import type { PostDetail } from "@/types/post-detail";
import type { PostDetailView } from "@/types/post-detail-view";
import type { PostSummary } from "@/types/post-summary";
import type { SearchHit } from "@/types/search-hit";
import type { SeriesSummary } from "@/types/series-summary";
import type { SiteStats } from "@/types/site-stats";
import type { WikiLinkTarget } from "@/types/wiki-link-target";

// 文章服务接口：在仓储之上封装定时发布生效、阅读数自增与 Markdown 渲染等业务规则
export interface PostService {
  // 前台分页列表（分页返回，先行落地到期的定时文章）
  listPublishedPage(
    page: number,
    pageSize: number,
    filter?: { categorySlug?: string; tagSlug?: string },
  ): Promise<PageResult<PostSummary>>;
  // 前台文章详情：含渲染结果、目录与上下篇，并自增阅读数
  getPublishedDetail(slug: string): Promise<PostDetailView | null>;
  // 只读查询文章详情（不增计阅读数），供 metadata、JSON-LD 等场景使用
  findPublishedDetail(slug: string): Promise<PostDetail | null>;
  // 前台文章页用：查询加密状态（是否需要密码才能查看）
  getPublishedUnlockState(
    slug: string,
  ): Promise<{ id: number; encrypted: boolean; passwordHash: string | null } | null>;
  // 校验文章访问密码：通过返回 slug 与密码哈希（供签发解锁令牌）
  verifyPostPassword(id: number, password: string): Promise<{ slug: string; passwordHash: string } | null>;
  // 归档列表：按 Asia/Shanghai 时区年份分组
  listArchiveGroups(): Promise<ArchiveGroup[]>;
  // 站内搜索：标题、摘要与正文模糊匹配，最多返回 20 条
  search(keyword: string): Promise<SearchHit[]>;
  // 文章页「相关文章」：按同标签/同分类相关度推荐，不足时以最新文章补齐
  listRelatedPosts(slug: string, limit: number): Promise<PostSummary[]>;
  // 系列总览：全部已发布系列及其文章
  listSeries(): Promise<SeriesSummary[]>;
  // 系列导航：指定系列下的全部已发布文章，按发布时间升序编号
  listSeriesPosts(series: string): Promise<PostSummary[]>;
  // sitemap 数据：全部已发布文章的 slug 与更新时间
  listSitemapEntries(): Promise<{ slug: string; updatedAt: Date }[]>;
  // RSS 数据：最近发布的文章详情
  listFeedItems(limit: number): Promise<PostDetail[]>;
  // 定时发布兜底入口：供服务器定时任务调用
  publishDuePosts(): Promise<number>;
  // 侧栏统计：文章数、分类数、标签数、总阅读量与最近更新时间
  getSiteStats(): Promise<SiteStats>;
  // Wiki Link 索引：全部已发布文章的轻量元数据
  listWikiLinkTargets(): Promise<WikiLinkTarget[]>;
}

import { compare } from "bcryptjs";
import { buildPageResult } from "@/lib/build-page-result";
import { formatYear } from "@/lib/format-date";
import { renderMarkdown } from "@/lib/markdown";
import type { PostRepository } from "@/server/repositories/post.repository.interface";
import type { ArchiveGroup } from "@/types/archive-group";
import type { PageResult } from "@/types/page-result";
import type { PostDetail } from "@/types/post-detail";
import type { PostDetailView } from "@/types/post-detail-view";
import type { PostSummary } from "@/types/post-summary";
import type { SearchHit } from "@/types/search-hit";
import type { SeriesSummary } from "@/types/series-summary";
import type { SiteStats } from "@/types/site-stats";
import type { WikiLinkTarget } from "@/types/wiki-link-target";
import type { PostService } from "./post.service.interface";

// 站内搜索返回条数上限
const SEARCH_LIMIT = 20;

// 文章服务默认实现：所有前台读取入口都会先落地到期的定时文章
export class DefaultPostService implements PostService {
  constructor(private readonly posts: PostRepository) {}

  // 惰性触发定时发布：把已到 scheduledAt 的文章转为已发布
  private async applyDuePosts(): Promise<void> {
    await this.posts.publishDuePosts(new Date());
  }

  async listPublishedPage(
    page: number,
    pageSize: number,
    filter?: { categorySlug?: string; tagSlug?: string },
  ): Promise<PageResult<PostSummary>> {
    await this.applyDuePosts();
    const result = await this.posts.findPublishedPage(page, pageSize, filter);
    return buildPageResult(result.items, result.total, page, pageSize);
  }

  async getPublishedDetail(slug: string): Promise<PostDetailView | null> {
    await this.applyDuePosts();
    const detail = await this.posts.findPublishedDetailBySlug(slug);
    if (!detail) {
      return null;
    }
    const [viewCount, neighbors, wikiLinkTargets] = await Promise.all([
      this.posts.incrementViewCount(detail.id),
      this.posts.findNeighbors(detail.publishedAt),
      this.posts.listPublishedWikiLinkTargets(),
    ]);
    const rendered = await renderMarkdown(detail.content, { wikiLinkTargets });
    return {
      post: { ...detail, viewCount },
      html: rendered.html,
      toc: rendered.toc,
      neighbors,
    };
  }

  async findPublishedDetail(slug: string): Promise<PostDetail | null> {
    await this.applyDuePosts();
    return this.posts.findPublishedDetailBySlug(slug);
  }

  async getPublishedUnlockState(
    slug: string,
  ): Promise<{ id: number; encrypted: boolean; passwordHash: string | null } | null> {
    await this.applyDuePosts();
    return this.posts.findPublishedUnlockStateBySlug(slug);
  }

  async verifyPostPassword(id: number, password: string): Promise<{ slug: string; passwordHash: string } | null> {
    const row = await this.posts.findPublishedPasswordHash(id);
    if (!row?.passwordHash) {
      return null;
    }
    const matched = await compare(password, row.passwordHash);
    return matched ? { slug: row.slug, passwordHash: row.passwordHash } : null;
  }

  async listArchiveGroups(): Promise<ArchiveGroup[]> {
    await this.applyDuePosts();
    const entries = await this.posts.listPublishedEntries();
    const groups = new Map<number, ArchiveGroup>();
    for (const entry of entries) {
      const year = formatYear(entry.publishedAt);
      const group = groups.get(year);
      if (group) {
        group.entries.push(entry);
      } else {
        groups.set(year, { year, entries: [entry] });
      }
    }
    return [...groups.values()];
  }

  async search(keyword: string): Promise<SearchHit[]> {
    const trimmed = keyword.trim();
    if (!trimmed) {
      return [];
    }
    await this.applyDuePosts();
    return this.posts.searchPublished(trimmed, SEARCH_LIMIT);
  }

  async listRelatedPosts(slug: string, limit: number): Promise<PostSummary[]> {
    await this.applyDuePosts();
    const detail = await this.posts.findPublishedDetailBySlug(slug);
    if (!detail) {
      return [];
    }
    return this.posts.listRelatedPublished({
      excludeSlug: slug,
      categorySlug: detail.category?.slug ?? null,
      tagSlugs: detail.tags.map((tag) => tag.slug),
      limit,
    });
  }

  async listSitemapEntries(): Promise<{ slug: string; updatedAt: Date }[]> {
    await this.applyDuePosts();
    return this.posts.listPublishedForSitemap();
  }

  async listSeries(): Promise<SeriesSummary[]> {
    await this.applyDuePosts();
    return this.posts.listPublishedSeries();
  }

  async listSeriesPosts(series: string): Promise<PostSummary[]> {
    await this.applyDuePosts();
    return this.posts.listPublishedBySeries(series);
  }

  async listFeedItems(limit: number): Promise<PostDetail[]> {
    await this.applyDuePosts();
    return this.posts.listRecentPublished(limit);
  }

  async publishDuePosts(): Promise<number> {
    return this.posts.publishDuePosts(new Date());
  }

  async getSiteStats(): Promise<SiteStats> {
    await this.applyDuePosts();
    return this.posts.findSiteStats();
  }

  async listWikiLinkTargets(): Promise<WikiLinkTarget[]> {
    await this.applyDuePosts();
    return this.posts.listPublishedWikiLinkTargets();
  }
}

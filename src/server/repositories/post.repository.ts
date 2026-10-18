import { PostStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toPlainText } from "@/lib/plain-text";
import { formatDateKey } from "@/lib/format-date";
import type { AdjacentPosts } from "@/types/adjacent-posts";
import type { ArchiveEntry } from "@/types/archive-entry";
import type { PostDetail } from "@/types/post-detail";
import type { PostSummary } from "@/types/post-summary";
import type { SearchHit } from "@/types/search-hit";
import type { SeriesSummary } from "@/types/series-summary";
import type { SiteStats } from "@/types/site-stats";
import type { WikiLinkTarget } from "@/types/wiki-link-target";
import type { PostRepository } from "./post.repository.interface";

type PostRowWithRelations = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverUrl: string | null;
  viewCount: number;
  pinned: boolean;
  encrypted: boolean;
  series: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  category: { name: string; slug: string } | null;
  tags: { tag: { name: string; slug: string } }[];
};

// 数据库行 → 列表项
function toSummary(row: PostRowWithRelations): PostSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    // 加密文章不回传摘要，避免正文信息提前泄露
    excerpt: row.encrypted ? "" : (row.excerpt ?? toPlainText(row.content)),
    coverUrl: row.coverUrl,
    publishedAt: row.publishedAt ?? row.createdAt,
    viewCount: row.viewCount,
    pinned: row.pinned,
    encrypted: row.encrypted,
    series: row.series,
    category: row.category,
    tags: row.tags.map((item) => item.tag),
  };
}

// 数据库行 → 详情
function toDetail(row: PostRowWithRelations): PostDetail {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    coverUrl: row.coverUrl,
    viewCount: row.viewCount,
    encrypted: row.encrypted,
    series: row.series,
    publishedAt: row.publishedAt ?? row.createdAt,
    updatedAt: row.updatedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
    category: row.category,
    tags: row.tags.map((item) => item.tag),
  };
}

// 统一的关系查询字段
const relations = {
  category: { select: { name: true, slug: true } },
  tags: { include: { tag: { select: { name: true, slug: true } } } },
} as const;

// 基于 Prisma 的文章仓储实现
export class PrismaPostRepository implements PostRepository {
  async publishDuePosts(now: Date): Promise<number> {
    const due = await prisma.post.findMany({
      where: { status: PostStatus.SCHEDULED, scheduledAt: { lte: now } },
      select: { id: true, scheduledAt: true },
    });
    if (due.length === 0) {
      return 0;
    }
    await prisma.$transaction(
      due.map((post) =>
        prisma.post.update({
          where: { id: post.id },
          data: { status: PostStatus.PUBLISHED, publishedAt: post.scheduledAt ?? now },
        }),
      ),
    );
    return due.length;
  }

  async findPublishedPage(
    page: number,
    pageSize: number,
    filter?: { categorySlug?: string; tagSlug?: string },
  ): Promise<{ items: PostSummary[]; total: number }> {
    const where = {
      status: PostStatus.PUBLISHED,
      ...(filter?.categorySlug ? { category: { slug: filter.categorySlug } } : {}),
      ...(filter?.tagSlug ? { tags: { some: { tag: { slug: filter.tagSlug } } } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: relations,
      }),
      prisma.post.count({ where }),
    ]);

    return { items: rows.map(toSummary), total };
  }

  async findPublishedDetailBySlug(slug: string): Promise<PostDetail | null> {
    const row = await prisma.post.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
      include: relations,
    });
    return row ? toDetail(row) : null;
  }

  async findPublishedPasswordHash(id: number): Promise<{ slug: string; passwordHash: string | null } | null> {
    const row = await prisma.post.findFirst({
      where: { id, status: PostStatus.PUBLISHED, encrypted: true },
      select: { slug: true, passwordHash: true },
    });
    return row ? { slug: row.slug, passwordHash: row.passwordHash } : null;
  }

  async findPublishedUnlockStateBySlug(
    slug: string,
  ): Promise<{ id: number; encrypted: boolean; passwordHash: string | null } | null> {
    const row = await prisma.post.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
      select: { id: true, encrypted: true, passwordHash: true },
    });
    return row ?? null;
  }

  async findNeighbors(publishedAt: Date): Promise<AdjacentPosts> {
    const [prev, next] = await Promise.all([
      prisma.post.findFirst({
        where: { status: PostStatus.PUBLISHED, publishedAt: { gt: publishedAt } },
        orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
        select: { title: true, slug: true },
      }),
      prisma.post.findFirst({
        where: { status: PostStatus.PUBLISHED, publishedAt: { lt: publishedAt } },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        select: { title: true, slug: true },
      }),
    ]);
    return { prev, next };
  }

  async incrementViewCount(id: number): Promise<number> {
    const updated = await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    return updated.viewCount;
  }

  async listPublishedEntries(): Promise<ArchiveEntry[]> {
    const rows = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED, publishedAt: { not: null } },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      select: { title: true, slug: true, publishedAt: true, ...relations },
    });
    return rows.flatMap((row) =>
      row.publishedAt
        ? [
            {
              title: row.title,
              slug: row.slug,
              publishedAt: row.publishedAt,
              category: row.category,
              tags: row.tags.map((item) => item.tag),
            },
          ]
        : [],
    );
  }

  async listRelatedPublished(params: {
    excludeSlug: string;
    categorySlug: string | null;
    tagSlugs: string[];
    limit: number;
  }): Promise<PostSummary[]> {
    const { excludeSlug, categorySlug, tagSlugs, limit } = params;
    if (limit <= 0) {
      return [];
    }
    // 标签命中与分类命中分两次查询后合并去重，避免依赖未类型化的 OR 数组
    const tagRows =
      tagSlugs.length > 0
        ? await prisma.post.findMany({
            where: { status: PostStatus.PUBLISHED, slug: { not: excludeSlug }, tags: { some: { tag: { slug: { in: tagSlugs } } } } },
            orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
            take: limit * 4,
            include: relations,
          })
        : [];
    const categoryRows = categorySlug
      ? await prisma.post.findMany({
          where: { status: PostStatus.PUBLISHED, slug: { not: excludeSlug }, category: { slug: categorySlug } },
          orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
          take: limit * 4,
          include: relations,
        })
      : [];
    const merged = new Map<number, PostRowWithRelations>();
    for (const row of [...tagRows, ...categoryRows]) {
      if (!merged.has(row.id)) {
        merged.set(row.id, row);
      }
    }
    // 相关度打分：相同标签权重更高，同分类次之；同分时新发布的在前
    const scored = [...merged.values()].map((row) => {
      const sharedTags = row.tags.filter((item) => tagSlugs.includes(item.tag.slug)).length;
      const sameCategory = categorySlug !== null && row.category?.slug === categorySlug ? 1 : 0;
      return { row, score: sharedTags * 2 + sameCategory };
    });
    scored.sort(
      (a, b) =>
        b.score - a.score ||
        (b.row.publishedAt ?? b.row.createdAt).getTime() - (a.row.publishedAt ?? a.row.createdAt).getTime(),
    );
    const picked = scored.slice(0, limit).map((item) => toSummary(item.row));
    if (picked.length >= limit) {
      return picked;
    }
    // 相关文章不足时用最新已发布文章补齐，保证卡片内容充实
    const fillers = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        slug: { notIn: [excludeSlug, ...picked.map((item) => item.slug)] },
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
      take: limit - picked.length,
      include: relations,
    });
    return [...picked, ...fillers.map(toSummary)];
  }

  async findSiteStats(): Promise<SiteStats> {
    const [publishedCount, categoryCount, tagCount, views, wordRows, latest] = await Promise.all([
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      // 正文字符数合计（UTF-8 下中文按 1 个字符计），与官网「总字数」一致
      prisma.$queryRaw<{ total: bigint | number }[]>`SELECT CAST(COALESCE(SUM(CHAR_LENGTH(content)), 0) AS SIGNED) AS total FROM posts WHERE status = 'PUBLISHED'`,
      prisma.post.findFirst({
        where: { status: PostStatus.PUBLISHED },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);
    return {
      publishedCount,
      categoryCount,
      tagCount,
      totalViews: views._sum.viewCount ?? 0,
      totalWords: Number(wordRows[0]?.total ?? 0),
      latestUpdatedAt: latest?.updatedAt ?? null,
    };
  }

  async listPublishedSeries(): Promise<SeriesSummary[]> {
    const rows = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED, series: { not: null } },
      orderBy: [{ series: "desc" }, { publishedAt: "asc" }, { id: "asc" }],
      include: relations,
    });
    const groups = new Map<string, PostSummary[]>();
    for (const row of rows) {
      const name = row.series?.trim();
      if (!name) {
        continue;
      }
      const posts = groups.get(name);
      if (posts) {
        posts.push(toSummary(row));
      } else {
        groups.set(name, [toSummary(row)]);
      }
    }
    return [...groups.entries()].map(([name, posts]) => ({ name, posts }));
  }

  async listPublishedBySeries(series: string): Promise<PostSummary[]> {
    const name = series.trim();
    if (!name) {
      return [];
    }
    const rows = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED, series: name },
      orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
      include: relations,
    });
    return rows.map(toSummary);
  }

  async searchPublished(keyword: string, limit: number): Promise<SearchHit[]> {
    const rows = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        // 加密文章不参与搜索，避免通过正文命中泄露内容
        encrypted: false,
        OR: [
          { title: { contains: keyword } },
          { excerpt: { contains: keyword } },
          { content: { contains: keyword } },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        createdAt: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt ?? toPlainText(row.content),
      publishedAt: row.publishedAt ?? row.createdAt,
    }));
  }

  async listPublishedForSitemap(): Promise<{ slug: string; updatedAt: Date }[]> {
    return prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }],
      select: { slug: true, updatedAt: true },
    });
  }

  async listRecentPublished(limit: number): Promise<PostDetail[]> {
    const rows = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: limit,
      include: relations,
    });
    return rows.map(toDetail);
  }

  async listPublishedWikiLinkTargets(): Promise<WikiLinkTarget[]> {
    const rows = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      select: {
        slug: true,
        title: true,
        excerpt: true,
        coverUrl: true,
        encrypted: true,
        publishedAt: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: { select: { name: true, slug: true } } } },
      },
    });
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.encrypted ? "该文章已加密，访问后输入密码查看。" : (row.excerpt ?? ""),
      coverUrl: row.coverUrl,
      publishedAt: formatDateKey(row.publishedAt ?? row.createdAt),
      category: row.category,
      tags: row.tags.map((item) => item.tag),
      encrypted: row.encrypted,
    }));
  }
}

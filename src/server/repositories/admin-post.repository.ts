import { Prisma, PostStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminPostDetail } from "@/types/admin-post-detail";
import type { AdminPostListItem } from "@/types/admin-post-list-item";
import type { PostWriteInput } from "@/types/post-write-input";
import type { AdminPostRepository } from "./admin-post.repository.interface";

// 列表查询统一字段
const listSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  pinned: true,
  encrypted: true,
  coverUrl: true,
  publishedAt: true,
  scheduledAt: true,
  updatedAt: true,
  viewCount: true,
  category: { select: { id: true, name: true } },
} as const;

// 把入参转为 Prisma 写入数据（标签关联单独处理）
function toWriteData(input: PostWriteInput) {
  return {
    title: input.title,
    slug: input.slug,
    content: input.content,
    excerpt: input.excerpt,
    coverUrl: input.coverUrl,
    status: input.status,
    pinned: input.pinned,
    encrypted: input.encrypted,
    passwordHash: input.passwordHash,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    seoKeywords: input.seoKeywords,
    publishedAt: input.publishedAt,
    scheduledAt: input.scheduledAt,
    categoryId: input.categoryId,
    series: input.series,
  };
}

// 基于 Prisma 的后台文章仓储实现
export class PrismaAdminPostRepository implements AdminPostRepository {
  async findPage(params: {
    page: number;
    pageSize: number;
    status?: PostStatus;
    keyword?: string;
  }): Promise<{ items: AdminPostListItem[]; total: number }> {
    const where: Prisma.PostWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.keyword
        ? {
            OR: [{ title: { contains: params.keyword } }, { slug: { contains: params.keyword } }],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: listSelect,
      }),
      prisma.post.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: number): Promise<AdminPostDetail | null> {
    const row = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        coverUrl: true,
        status: true,
        pinned: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        publishedAt: true,
        scheduledAt: true,
        categoryId: true,
        series: true,
        encrypted: true,
        tags: { select: { tagId: true } },
      },
    });
    if (!row) {
      return null;
    }
    const { tags, ...rest } = row;
    return { ...rest, tagIds: tags.map((item) => item.tagId) };
  }

  async getPasswordHash(id: number): Promise<string | null> {
    const row = await prisma.post.findUnique({ where: { id }, select: { passwordHash: true } });
    return row?.passwordHash ?? null;
  }

  async create(input: PostWriteInput): Promise<{ id: number }> {
    return prisma.$transaction(async (tx) => {
      const created = await tx.post.create({ data: toWriteData(input), select: { id: true } });
      if (input.tagIds.length > 0) {
        await tx.postTag.createMany({
          data: input.tagIds.map((tagId) => ({ postId: created.id, tagId })),
          skipDuplicates: true,
        });
      }
      return created;
    });
  }

  async update(id: number, input: PostWriteInput): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.post.update({ where: { id }, data: toWriteData(input) });
      await tx.postTag.deleteMany({ where: { postId: id } });
      if (input.tagIds.length > 0) {
        await tx.postTag.createMany({
          data: input.tagIds.map((tagId) => ({ postId: id, tagId })),
          skipDuplicates: true,
        });
      }
    });
  }

  async deleteMany(ids: number[]): Promise<number> {
    const result = await prisma.post.deleteMany({ where: { id: { in: ids } } });
    return result.count;
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const count = await prisma.post.count({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async countByStatus(): Promise<Record<PostStatus, number>> {
    const rows = await prisma.post.groupBy({ by: ["status"], _count: { _all: true } });
    const counts: Record<PostStatus, number> = {
      DRAFT: 0,
      SCHEDULED: 0,
      PUBLISHED: 0,
      PRIVATE: 0,
    };
    for (const row of rows) {
      counts[row.status] = row._count._all;
    }
    return counts;
  }

  async sumViews(): Promise<number> {
    const result = await prisma.post.aggregate({ _sum: { viewCount: true } });
    return result._sum.viewCount ?? 0;
  }

  async listRecent(limit: number): Promise<AdminPostListItem[]> {
    return prisma.post.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: limit,
      select: listSelect,
    });
  }

  // 按阅读量排行（仪表盘热门文章）
  async listTopViewed(limit: number): Promise<AdminPostListItem[]> {
    return prisma.post.findMany({
      orderBy: [{ viewCount: "desc" }, { id: "desc" }],
      take: limit,
      select: listSelect,
    });
  }

  async listPublishedSince(since: Date): Promise<Date[]> {
    const rows = await prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED, publishedAt: { gte: since } },
      select: { publishedAt: true },
    });
    return rows.map((row) => row.publishedAt).filter((value): value is Date => value !== null);
  }

  async countWithoutCover(): Promise<number> {
    return prisma.post.count({ where: { OR: [{ coverUrl: null }, { coverUrl: "" }] } });
  }

  async countEncrypted(): Promise<number> {
    return prisma.post.count({ where: { encrypted: true } });
  }

  async findNextScheduledAt(): Promise<Date | null> {
    const row = await prisma.post.findFirst({
      where: { status: PostStatus.SCHEDULED, scheduledAt: { not: null } },
      orderBy: { scheduledAt: "asc" },
      select: { scheduledAt: true },
    });
    return row?.scheduledAt ?? null;
  }
}

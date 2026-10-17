import { PostStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TagItem } from "@/types/tag-item";
import type { TagRepository } from "./tag.repository.interface";

// 基于 Prisma 的标签仓储实现
export class PrismaTagRepository implements TagRepository {
  async listAllWithCounts(): Promise<TagItem[]> {
    const rows = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { posts: { where: { post: { status: PostStatus.PUBLISHED } } } } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      postCount: row._count.posts,
    }));
  }

  async findBySlug(slug: string): Promise<{ id: number; name: string; slug: string } | null> {
    return prisma.tag.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
  }
}

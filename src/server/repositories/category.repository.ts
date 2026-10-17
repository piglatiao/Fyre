import { prisma } from "@/lib/prisma";
import { PostStatus } from "@/generated/prisma/client";
import type { CategoryInfo } from "@/types/category-info";
import type { CategoryItem } from "@/types/category-item";
import type { CategoryRepository } from "./category.repository.interface";

// 基于 Prisma 的分类仓储实现
export class PrismaCategoryRepository implements CategoryRepository {
  async findBySlug(slug: string): Promise<CategoryInfo | null> {
    return prisma.category.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, description: true },
    });
  }

  async listAllSlugs(): Promise<string[]> {
    const rows = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  }

  async listAllWithCounts(): Promise<CategoryItem[]> {
    const rows = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { posts: { where: { status: PostStatus.PUBLISHED } } } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      postCount: row._count.posts,
    }));
  }
}

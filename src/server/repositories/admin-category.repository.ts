import { prisma } from "@/lib/prisma";
import type { AdminCategoryItem } from "@/types/admin-category-item";
import type { CategoryUpsertInput } from "@/types/category-upsert-input";
import type { AdminCategoryRepository } from "./admin-category.repository.interface";

// 基于 Prisma 的后台分类仓储实现
export class PrismaAdminCategoryRepository implements AdminCategoryRepository {
  async listWithCounts(): Promise<AdminCategoryItem[]> {
    const rows = await prisma.category.findMany({
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      include: { _count: { select: { posts: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sort: row.sort,
      postCount: row._count.posts,
    }));
  }

  async findById(id: number): Promise<AdminCategoryItem | null> {
    const row = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sort: row.sort,
      postCount: row._count.posts,
    };
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const count = await prisma.category.count({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(input: CategoryUpsertInput): Promise<{ id: number }> {
    return prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        sort: input.sort,
      },
      select: { id: true },
    });
  }

  async update(id: number, input: CategoryUpsertInput): Promise<void> {
    await prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        sort: input.sort,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }

  async countPosts(categoryId: number): Promise<number> {
    return prisma.post.count({ where: { categoryId } });
  }

  async reassignPosts(fromCategoryId: number, toCategoryId: number | null): Promise<number> {
    const result = await prisma.post.updateMany({
      where: { categoryId: fromCategoryId },
      data: { categoryId: toCategoryId },
    });
    return result.count;
  }

  async countAll(): Promise<number> {
    return prisma.category.count();
  }
}

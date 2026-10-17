import { prisma } from "@/lib/prisma";
import type { TagItem } from "@/types/tag-item";
import type { TagUpsertInput } from "@/types/tag-upsert-input";
import type { AdminTagRepository } from "./admin-tag.repository.interface";

// 基于 Prisma 的后台标签仓储实现
export class PrismaAdminTagRepository implements AdminTagRepository {
  async listWithCounts(): Promise<TagItem[]> {
    const rows = await prisma.tag.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: { _count: { select: { posts: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      postCount: row._count.posts,
    }));
  }

  async findById(id: number): Promise<TagItem | null> {
    const row = await prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
    if (!row) {
      return null;
    }
    return { id: row.id, name: row.name, slug: row.slug, postCount: row._count.posts };
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const count = await prisma.tag.count({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async nameExists(name: string, excludeId?: number): Promise<boolean> {
    const count = await prisma.tag.count({
      where: { name, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(input: TagUpsertInput): Promise<{ id: number }> {
    return prisma.tag.create({ data: { name: input.name, slug: input.slug }, select: { id: true } });
  }

  async update(id: number, input: TagUpsertInput): Promise<void> {
    await prisma.tag.update({ where: { id }, data: { name: input.name, slug: input.slug } });
  }

  async remove(id: number): Promise<void> {
    await prisma.tag.delete({ where: { id } });
  }

  async countAll(): Promise<number> {
    return prisma.tag.count();
  }

  async merge(sourceId: number, targetId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const links = await tx.postTag.findMany({ where: { tagId: sourceId }, select: { postId: true } });
      if (links.length > 0) {
        await tx.postTag.createMany({
          data: links.map((link) => ({ postId: link.postId, tagId: targetId })),
          skipDuplicates: true,
        });
      }
      await tx.postTag.deleteMany({ where: { tagId: sourceId } });
      await tx.tag.delete({ where: { id: sourceId } });
    });
  }
}

import { prisma } from "@/lib/prisma";
import type { AdminPageDetail } from "@/types/admin-page-detail";
import type { AdminPageItem } from "@/types/admin-page-item";
import type { PageUpsertInput } from "@/types/page-upsert-input";
import type { AdminPageRepository } from "./admin-page.repository.interface";

// 基于 Prisma 的后台页面仓储实现
export class PrismaAdminPageRepository implements AdminPageRepository {
  async listAll(): Promise<AdminPageItem[]> {
    return prisma.page.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: { id: true, title: true, slug: true, published: true, updatedAt: true },
    });
  }

  async findById(id: number): Promise<AdminPageDetail | null> {
    return prisma.page.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, content: true, published: true, updatedAt: true },
    });
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const count = await prisma.page.count({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(input: PageUpsertInput): Promise<{ id: number }> {
    return prisma.page.create({
      data: {
        title: input.title,
        slug: input.slug,
        content: input.content,
        published: input.published,
      },
      select: { id: true },
    });
  }

  async update(id: number, input: PageUpsertInput): Promise<void> {
    await prisma.page.update({
      where: { id },
      data: {
        title: input.title,
        slug: input.slug,
        content: input.content,
        published: input.published,
      },
    });
  }

  async remove(id: number): Promise<void> {
    await prisma.page.delete({ where: { id } });
  }

  async countAll(): Promise<number> {
    return prisma.page.count();
  }
}

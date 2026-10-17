import { prisma } from "@/lib/prisma";
import type { CustomPage } from "@/types/custom-page";
import type { PageRepository } from "./page.repository.interface";

// 基于 Prisma 的自定义页面仓储实现
export class PrismaPageRepository implements PageRepository {
  async findPublishedBySlug(slug: string): Promise<CustomPage | null> {
    return prisma.page.findFirst({
      where: { slug, published: true },
      select: { title: true, slug: true, content: true, updatedAt: true },
    });
  }

  async listPublished(): Promise<{ slug: string; updatedAt: Date }[]> {
    return prisma.page.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, updatedAt: true },
    });
  }
}

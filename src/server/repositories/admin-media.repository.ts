import { Prisma, MediaType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { MediaCreateInput } from "@/types/media-create-input";
import type { MediaItem } from "@/types/media-item";
import type { AdminMediaRepository } from "./admin-media.repository.interface";

// 媒体记录统一字段
const mediaSelect = {
  id: true,
  filename: true,
  originalName: true,
  url: true,
  mimeType: true,
  size: true,
  type: true,
  createdAt: true,
} as const;

// 基于 Prisma 的后台媒体仓储实现
export class PrismaAdminMediaRepository implements AdminMediaRepository {
  async findPage(params: {
    page: number;
    pageSize: number;
    type?: MediaType;
  }): Promise<{ items: MediaItem[]; total: number }> {
    const where: Prisma.MediaWhereInput = params.type ? { type: params.type } : {};
    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: mediaSelect,
      }),
      prisma.media.count({ where }),
    ]);
    return { items, total };
  }

  async create(input: MediaCreateInput): Promise<MediaItem> {
    return prisma.media.create({ data: input, select: mediaSelect });
  }

  async findById(id: number): Promise<MediaItem | null> {
    return prisma.media.findUnique({ where: { id }, select: mediaSelect });
  }

  async remove(id: number): Promise<void> {
    await prisma.media.delete({ where: { id } });
  }

  async countAll(): Promise<number> {
    return prisma.media.count();
  }
}

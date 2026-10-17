import { Prisma } from "@/generated/prisma/client";
import { toDynamicImages } from "@/lib/dynamic-images";
import { formatYear } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";
import type { DynamicRecord } from "@/types/dynamic-record";
import type { DynamicRepository } from "./dynamic.repository.interface";

// 列表查询统一字段
const recordSelect = {
  id: true,
  content: true,
  images: true,
  location: true,
  pinned: true,
  publishedAt: true,
} as const;

type DynamicRow = Prisma.DynamicGetPayload<{ select: typeof recordSelect }>;

// 数据库行转换为仓储记录（images 是 JSON 列，需要规范化后再交给服务层）
function toRecord(row: DynamicRow): DynamicRecord {
  return {
    id: row.id,
    content: row.content,
    images: toDynamicImages(row.images),
    location: row.location,
    pinned: row.pinned,
    publishedAt: row.publishedAt,
  };
}

// Asia/Shanghai 时区下的年份区间：起点为当年 1 月 1 日 00:00（UTC+8）
function yearRange(year: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(`${year}-01-01T00:00:00+08:00`),
    lt: new Date(`${year + 1}-01-01T00:00:00+08:00`),
  };
}

// 基于 Prisma 的动态仓储实现（前台公开读取）
export class PrismaDynamicRepository implements DynamicRepository {
  async findPublishedPage(params: {
    page: number;
    pageSize: number;
    year?: number;
    keyword?: string;
  }): Promise<{ items: DynamicRecord[]; total: number }> {
    const where: Prisma.DynamicWhereInput = {
      publishedAt: {
        lte: new Date(),
        ...(params.year ? yearRange(params.year) : {}),
      },
      ...(params.keyword
        ? {
            OR: [
              { content: { contains: params.keyword } },
              { location: { contains: params.keyword } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.dynamic.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: recordSelect,
      }),
      prisma.dynamic.count({ where }),
    ]);
    return { items: rows.map(toRecord), total };
  }

  async listRecentPublished(limit: number): Promise<DynamicRecord[]> {
    const rows = await prisma.dynamic.findMany({
      where: { publishedAt: { lte: new Date() } },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      take: limit,
      select: recordSelect,
    });
    return rows.map(toRecord);
  }

  async countPublished(): Promise<number> {
    return prisma.dynamic.count({ where: { publishedAt: { lte: new Date() } } });
  }

  async listPublishedYears(): Promise<number[]> {
    const rows = await prisma.dynamic.findMany({
      where: { publishedAt: { lte: new Date() } },
      select: { publishedAt: true },
    });
    const years = new Set(rows.map((row) => formatYear(row.publishedAt)));
    return [...years].sort((a, b) => b - a);
  }
}
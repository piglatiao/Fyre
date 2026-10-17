import { Prisma } from "@/generated/prisma/client";
import { toDynamicImages } from "@/lib/dynamic-images";
import { prisma } from "@/lib/prisma";
import type { AdminDynamicEntry } from "@/types/admin-dynamic-entry";
import type { DynamicWriteInput } from "@/types/dynamic-write-input";
import type { AdminDynamicRepository } from "./admin-dynamic.repository.interface";

// 列表与详情统一字段
const entrySelect = {
  id: true,
  content: true,
  images: true,
  location: true,
  pinned: true,
  publishedAt: true,
  createdAt: true,
} as const;

type DynamicEntryRow = Prisma.DynamicGetPayload<{ select: typeof entrySelect }>;

// 数据库行转换为后台条目（images 是 JSON 列，需要规范化）
function toEntry(row: DynamicEntryRow): AdminDynamicEntry {
  return {
    id: row.id,
    content: row.content,
    images: toDynamicImages(row.images),
    location: row.location,
    pinned: row.pinned,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
  };
}

// 入参转换为 Prisma 写入数据（images 需要显式转成 Json 入参类型）
function toWriteData(input: DynamicWriteInput) {
  return {
    content: input.content,
    images: input.images as unknown as Prisma.InputJsonValue,
    location: input.location,
    pinned: input.pinned,
    publishedAt: input.publishedAt,
  };
}

// 基于 Prisma 的动态仓储实现（后台）
export class PrismaAdminDynamicRepository implements AdminDynamicRepository {
  async findPage(params: { page: number; pageSize: number }): Promise<{ items: AdminDynamicEntry[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.dynamic.findMany({
        orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: entrySelect,
      }),
      prisma.dynamic.count(),
    ]);
    return { items: rows.map(toEntry), total };
  }

  async findById(id: number): Promise<AdminDynamicEntry | null> {
    const row = await prisma.dynamic.findUnique({ where: { id }, select: entrySelect });
    return row ? toEntry(row) : null;
  }

  async create(input: DynamicWriteInput): Promise<{ id: number }> {
    return prisma.dynamic.create({ data: toWriteData(input), select: { id: true } });
  }

  async update(id: number, input: DynamicWriteInput): Promise<void> {
    await prisma.dynamic.update({ where: { id }, data: toWriteData(input) });
  }

  async remove(id: number): Promise<void> {
    await prisma.dynamic.delete({ where: { id } });
  }
}
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/string-array";
import type { AdminFriendLinkItem } from "@/types/admin-friend-link-item";
import type { FriendLinkInput } from "@/types/friend-link-input";
import type { AdminFriendLinkRepository } from "./admin-friend-link.repository.interface";

// 统一查询字段
const itemSelect = {
  id: true,
  title: true,
  avatarUrl: true,
  description: true,
  siteUrl: true,
  tags: true,
  weight: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
} as const;

type FriendLinkRow = Prisma.FriendLinkGetPayload<{ select: typeof itemSelect }>;

// 数据库行转换为后台条目
function toItem(row: FriendLinkRow): AdminFriendLinkItem {
  return { ...row, tags: toStringArray(row.tags) };
}

// 入参转换为 Prisma 写入数据
function toWriteData(input: FriendLinkInput) {
  return {
    title: input.title,
    avatarUrl: input.avatarUrl,
    description: input.description,
    siteUrl: input.siteUrl,
    tags: input.tags as unknown as Prisma.InputJsonValue,
    weight: input.weight,
    enabled: input.enabled,
  };
}

// 基于 Prisma 的友链后台仓储实现
export class PrismaAdminFriendLinkRepository implements AdminFriendLinkRepository {
  async listAll(): Promise<AdminFriendLinkItem[]> {
    const rows = await prisma.friendLink.findMany({
      orderBy: [{ weight: "desc" }, { createdAt: "desc" }],
      select: itemSelect,
    });
    return rows.map(toItem);
  }

  async findById(id: number): Promise<AdminFriendLinkItem | null> {
    const row = await prisma.friendLink.findUnique({ where: { id }, select: itemSelect });
    return row ? toItem(row) : null;
  }

  async create(input: FriendLinkInput): Promise<{ id: number }> {
    return prisma.friendLink.create({ data: toWriteData(input), select: { id: true } });
  }

  async update(id: number, input: FriendLinkInput): Promise<void> {
    await prisma.friendLink.update({ where: { id }, data: toWriteData(input) });
  }

  async remove(id: number): Promise<void> {
    await prisma.friendLink.delete({ where: { id } });
  }
}

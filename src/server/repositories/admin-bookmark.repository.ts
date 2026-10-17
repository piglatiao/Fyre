import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminBookmarkGroup } from "@/types/admin-bookmark-group";
import type { AdminBookmarkItem } from "@/types/admin-bookmark-item";
import type { BookmarkGroupInput } from "@/types/bookmark-group-input";
import type { BookmarkItemInput } from "@/types/bookmark-item-input";
import type { AdminBookmarkRepository } from "./admin-bookmark.repository.interface";

// 分组查询字段（含全部条目）
const groupSelect = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  description: true,
  weight: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
  bookmarks: {
    orderBy: [{ weight: "desc" }, { id: "asc" }],
    select: {
      id: true,
      groupId: true,
      title: true,
      url: true,
      description: true,
      icon: true,
      weight: true,
      enabled: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.BookmarkGroupSelect;

// 单条书签查询字段
const itemSelect = {
  id: true,
  groupId: true,
  title: true,
  url: true,
  description: true,
  icon: true,
  weight: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BookmarkSelect;

// 分组入参转换为 Prisma 写入数据
function toGroupData(input: BookmarkGroupInput) {
  return {
    name: input.name,
    slug: input.slug,
    icon: input.icon,
    description: input.description,
    weight: input.weight,
    enabled: input.enabled,
  };
}

// 书签入参转换为 Prisma 写入数据
function toItemData(input: BookmarkItemInput) {
  return {
    groupId: input.groupId,
    title: input.title,
    url: input.url,
    description: input.description,
    icon: input.icon,
    weight: input.weight,
    enabled: input.enabled,
  };
}

// 基于 Prisma 的书签后台仓储实现
export class PrismaAdminBookmarkRepository implements AdminBookmarkRepository {
  async listGroups(): Promise<AdminBookmarkGroup[]> {
    const rows = await prisma.bookmarkGroup.findMany({
      orderBy: [{ weight: "desc" }, { id: "asc" }],
      select: groupSelect,
    });
    return rows.map((row) => ({ ...row, items: row.bookmarks }));
  }

  async findGroupById(id: number): Promise<AdminBookmarkGroup | null> {
    const row = await prisma.bookmarkGroup.findUnique({ where: { id }, select: groupSelect });
    return row ? { ...row, items: row.bookmarks } : null;
  }

  async findGroupBySlug(slug: string): Promise<{ id: number } | null> {
    return prisma.bookmarkGroup.findUnique({ where: { slug }, select: { id: true } });
  }

  async createGroup(input: BookmarkGroupInput): Promise<{ id: number }> {
    return prisma.bookmarkGroup.create({ data: toGroupData(input), select: { id: true } });
  }

  async updateGroup(id: number, input: BookmarkGroupInput): Promise<void> {
    await prisma.bookmarkGroup.update({ where: { id }, data: toGroupData(input) });
  }

  async removeGroup(id: number): Promise<void> {
    await prisma.bookmarkGroup.delete({ where: { id } });
  }

  async findItemById(id: number): Promise<AdminBookmarkItem | null> {
    return prisma.bookmark.findUnique({ where: { id }, select: itemSelect });
  }

  async createItem(input: BookmarkItemInput): Promise<{ id: number }> {
    return prisma.bookmark.create({ data: toItemData(input), select: { id: true } });
  }

  async updateItem(id: number, input: BookmarkItemInput): Promise<void> {
    await prisma.bookmark.update({ where: { id }, data: toItemData(input) });
  }

  async removeItem(id: number): Promise<void> {
    await prisma.bookmark.delete({ where: { id } });
  }
}

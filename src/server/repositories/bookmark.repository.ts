import { prisma } from "@/lib/prisma";
import type { BookmarkGroup } from "@/types/bookmark-group";
import type { BookmarkRepository } from "./bookmark.repository.interface";

// 基于 Prisma 的书签前台仓储实现
export class PrismaBookmarkRepository implements BookmarkRepository {
  async listEnabledGroups(): Promise<BookmarkGroup[]> {
    const rows = await prisma.bookmarkGroup.findMany({
      where: { enabled: true },
      orderBy: [{ weight: "desc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        weight: true,
        bookmarks: {
          where: { enabled: true },
          orderBy: [{ weight: "desc" }, { id: "asc" }],
          select: { id: true, title: true, url: true, description: true, icon: true, weight: true },
        },
      },
    });
    return rows.map((row) => ({ ...row, items: row.bookmarks, bookmarks: undefined }));
  }
}

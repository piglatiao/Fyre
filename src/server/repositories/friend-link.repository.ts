import { prisma } from "@/lib/prisma";
import { toStringArray } from "@/lib/string-array";
import type { FriendLinkRecord } from "@/types/friend-link-record";
import type { FriendLinkRepository } from "./friend-link.repository.interface";

// 基于 Prisma 的友链前台仓储实现
export class PrismaFriendLinkRepository implements FriendLinkRepository {
  async listEnabled(): Promise<FriendLinkRecord[]> {
    const rows = await prisma.friendLink.findMany({
      where: { enabled: true },
      orderBy: [{ weight: "desc" }, { id: "asc" }],
      select: {
        id: true,
        title: true,
        avatarUrl: true,
        description: true,
        siteUrl: true,
        tags: true,
        weight: true,
        enabled: true,
      },
    });
    return rows.map((row) => ({ ...row, tags: toStringArray(row.tags) }));
  }
}

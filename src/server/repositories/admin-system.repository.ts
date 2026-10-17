import { prisma } from "@/lib/prisma";
import type { AdminSystemRepository } from "./admin-system.repository.interface";

// 系统信息仓储实现：库大小走 information_schema，媒体占用走聚合查询
export class PrismaAdminSystemRepository implements AdminSystemRepository {
  async getDatabaseBytes(): Promise<number> {
    const rows = await prisma.$queryRaw<{ total: bigint | number }[]>`
      SELECT CAST(COALESCE(SUM(data_length + index_length), 0) AS SIGNED) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `;
    return Number(rows[0]?.total ?? 0);
  }

  async getMediaUsage(): Promise<{ files: number; bytes: number }> {
    const rows = await prisma.$queryRaw<{ files: bigint | number; bytes: bigint | number }[]>`
      SELECT COUNT(*) AS files, CAST(COALESCE(SUM(size), 0) AS SIGNED) AS bytes
      FROM media
    `;
    const row = rows[0];
    return { files: Number(row?.files ?? 0), bytes: Number(row?.bytes ?? 0) };
  }
}
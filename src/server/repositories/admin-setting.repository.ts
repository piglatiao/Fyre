import { prisma } from "@/lib/prisma";
import type { AdminSettingRepository } from "./admin-setting.repository.interface";

// 基于 Prisma 的后台设置仓储实现
export class PrismaAdminSettingRepository implements AdminSettingRepository {
  async findAll(): Promise<Record<string, string>> {
    const rows = await prisma.setting.findMany({ select: { key: true, value: true } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  async upsertMany(entries: { key: string; value: string }[]): Promise<void> {
    for (const entry of entries) {
      await prisma.setting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
    }
  }
}

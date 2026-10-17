import { prisma } from "@/lib/prisma";
import type { SettingRepository } from "./setting.repository.interface";

// 基于 Prisma 的站点设置仓储实现
export class PrismaSettingRepository implements SettingRepository {
  async findAll(): Promise<Record<string, string>> {
    const rows = await prisma.setting.findMany({ select: { key: true, value: true } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  // 取最近一次设置更新时间：设置表为空时返回 null
  async findLatestUpdatedAt(): Promise<Date | null> {
    const row = await prisma.setting.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    return row?.updatedAt ?? null;
  }
}

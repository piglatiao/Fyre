import { prisma } from "@/lib/prisma";
import type { SponsorMethod } from "@/types/sponsor-method";
import type { SponsorRecord } from "@/types/sponsor-record";
import type { SponsorRepository } from "./sponsor.repository.interface";

// 基于 Prisma 的打赏前台仓储实现
export class PrismaSponsorRepository implements SponsorRepository {
  async listEnabledMethods(): Promise<SponsorMethod[]> {
    return prisma.sponsorMethod.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "desc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        icon: true,
        qrCodeUrl: true,
        linkUrl: true,
        description: true,
        sortOrder: true,
      },
    });
  }

  async listEnabledRecords(): Promise<SponsorRecord[]> {
    return prisma.sponsorRecord.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        amount: true,
        message: true,
        sponsoredAt: true,
        sortOrder: true,
      },
    });
  }
}

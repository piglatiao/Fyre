import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminSponsorMethod } from "@/types/admin-sponsor-method";
import type { AdminSponsorRecord } from "@/types/admin-sponsor-record";
import type { SponsorMethodInput } from "@/types/sponsor-method-input";
import type { SponsorRecordInput } from "@/types/sponsor-record-input";
import type { AdminSponsorRepository } from "./admin-sponsor.repository.interface";

// 打赏方式查询字段
const methodSelect = {
  id: true,
  name: true,
  icon: true,
  qrCodeUrl: true,
  linkUrl: true,
  description: true,
  sortOrder: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SponsorMethodSelect;

// 打赏记录查询字段
const recordSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  amount: true,
  message: true,
  sponsoredAt: true,
  sortOrder: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SponsorRecordSelect;

// 打赏方式入参转换为 Prisma 写入数据
function toMethodData(input: SponsorMethodInput) {
  return {
    name: input.name,
    icon: input.icon,
    qrCodeUrl: input.qrCodeUrl,
    linkUrl: input.linkUrl,
    description: input.description,
    sortOrder: input.sortOrder,
    enabled: input.enabled,
  };
}

// 打赏记录入参转换为 Prisma 写入数据
function toRecordData(input: SponsorRecordInput) {
  return {
    name: input.name,
    avatarUrl: input.avatarUrl,
    amount: input.amount,
    message: input.message,
    sponsoredAt: input.sponsoredAt,
    sortOrder: input.sortOrder,
    enabled: input.enabled,
  };
}

// 基于 Prisma 的打赏后台仓储实现
export class PrismaAdminSponsorRepository implements AdminSponsorRepository {
  async listMethods(): Promise<AdminSponsorMethod[]> {
    return prisma.sponsorMethod.findMany({
      orderBy: [{ sortOrder: "desc" }, { id: "asc" }],
      select: methodSelect,
    });
  }

  async findMethodById(id: number): Promise<AdminSponsorMethod | null> {
    return prisma.sponsorMethod.findUnique({ where: { id }, select: methodSelect });
  }

  async createMethod(input: SponsorMethodInput): Promise<{ id: number }> {
    return prisma.sponsorMethod.create({ data: toMethodData(input), select: { id: true } });
  }

  async updateMethod(id: number, input: SponsorMethodInput): Promise<void> {
    await prisma.sponsorMethod.update({ where: { id }, data: toMethodData(input) });
  }

  async removeMethod(id: number): Promise<void> {
    await prisma.sponsorMethod.delete({ where: { id } });
  }

  async listRecords(): Promise<AdminSponsorRecord[]> {
    return prisma.sponsorRecord.findMany({
      orderBy: [{ sortOrder: "desc" }, { id: "desc" }],
      select: recordSelect,
    });
  }

  async findRecordById(id: number): Promise<AdminSponsorRecord | null> {
    return prisma.sponsorRecord.findUnique({ where: { id }, select: recordSelect });
  }

  async createRecord(input: SponsorRecordInput): Promise<{ id: number }> {
    return prisma.sponsorRecord.create({ data: toRecordData(input), select: { id: true } });
  }

  async updateRecord(id: number, input: SponsorRecordInput): Promise<void> {
    await prisma.sponsorRecord.update({ where: { id }, data: toRecordData(input) });
  }

  async removeRecord(id: number): Promise<void> {
    await prisma.sponsorRecord.delete({ where: { id } });
  }
}

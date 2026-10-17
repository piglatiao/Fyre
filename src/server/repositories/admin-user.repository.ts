import { prisma } from "@/lib/prisma";
import type { AdminUserAccount } from "@/types/admin-user-account";
import type { AdminUserRepository } from "./admin-user.repository.interface";

// 基于 Prisma 的后台管理员仓储实现
export class PrismaAdminUserRepository implements AdminUserRepository {
  async findById(id: number): Promise<AdminUserAccount | null> {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, nickname: true, passwordHash: true },
    });
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async updateNickname(id: number, nickname: string | null): Promise<void> {
    await prisma.user.update({ where: { id }, data: { nickname } });
  }
}

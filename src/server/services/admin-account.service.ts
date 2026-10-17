import { compare, hash } from "bcryptjs";
import type { AdminUserRepository } from "@/server/repositories/admin-user.repository.interface";
import type { AdminAccountService } from "./admin-account.service.interface";
import { ServiceError } from "./service-error";

// bcrypt 加密强度：与 seed 保持一致
const BCRYPT_ROUNDS = 10;

// 后台账号服务默认实现
export class DefaultAdminAccountService implements AdminAccountService {
  constructor(private readonly users: AdminUserRepository) {}

  async changePassword(userId: number, input: { currentPassword: string; newPassword: string }): Promise<void> {
    const account = await this.users.findById(userId);
    if (!account) {
      throw new ServiceError("account_not_found", "账号不存在");
    }
    const matched = await compare(input.currentPassword, account.passwordHash);
    if (!matched) {
      throw new ServiceError("password_mismatch", "当前密码不正确");
    }
    if (input.currentPassword === input.newPassword) {
      throw new ServiceError("password_unchanged", "新密码不能与当前密码相同");
    }
    await this.users.updatePassword(userId, await hash(input.newPassword, BCRYPT_ROUNDS));
  }

  async updateProfile(userId: number, input: { nickname: string | null }): Promise<void> {
    const account = await this.users.findById(userId);
    if (!account) {
      throw new ServiceError("account_not_found", "账号不存在");
    }
    await this.users.updateNickname(userId, input.nickname);
  }
}

import type { AdminUserAccount } from "@/types/admin-user-account";

// 后台管理员账号仓储接口
export interface AdminUserRepository {
  // 按 id 查询账号（含密码哈希）
  findById(id: number): Promise<AdminUserAccount | null>;
  // 更新密码哈希
  updatePassword(id: number, passwordHash: string): Promise<void>;
  // 更新昵称
  updateNickname(id: number, nickname: string | null): Promise<void>;
}

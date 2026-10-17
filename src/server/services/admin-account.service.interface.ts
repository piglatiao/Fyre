// 后台账号服务接口
export interface AdminAccountService {
  // 修改密码：校验当前密码后写入新哈希（旧会话将因指纹变化失效）
  changePassword(userId: number, input: { currentPassword: string; newPassword: string }): Promise<void>;
  // 修改昵称
  updateProfile(userId: number, input: { nickname: string | null }): Promise<void>;
}

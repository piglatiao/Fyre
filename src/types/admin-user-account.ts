// 管理员账号信息（含密码哈希，仅服务端使用）
export interface AdminUserAccount {
  id: number;
  username: string;
  nickname: string | null;
  passwordHash: string;
}

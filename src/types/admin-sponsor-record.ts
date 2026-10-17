// 后台打赏记录：补充启停状态与时间
export interface AdminSponsorRecord {
  id: number;
  name: string;
  avatarUrl: string;
  amount: string;
  message: string;
  sponsoredAt: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

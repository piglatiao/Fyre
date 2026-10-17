// 前台打赏记录
export interface SponsorRecord {
  id: number;
  name: string;
  avatarUrl: string;
  amount: string;
  message: string;
  sponsoredAt: string;
  sortOrder: number;
}

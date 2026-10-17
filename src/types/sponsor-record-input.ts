// 打赏记录新增/编辑入参
export interface SponsorRecordInput {
  name: string;
  avatarUrl: string;
  amount: string;
  message: string;
  sponsoredAt: string;
  sortOrder: number;
  enabled: boolean;
}

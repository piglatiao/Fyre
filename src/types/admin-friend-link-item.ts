// 后台友链条目：在展示字段基础上补充启停状态与时间
export interface AdminFriendLinkItem {
  id: number;
  title: string;
  avatarUrl: string;
  description: string;
  siteUrl: string;
  tags: string[];
  weight: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

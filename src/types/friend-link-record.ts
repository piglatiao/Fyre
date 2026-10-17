// 友链仓储记录：服务层与仓储层共享的内部结构
export interface FriendLinkRecord {
  id: number;
  title: string;
  avatarUrl: string;
  description: string;
  siteUrl: string;
  tags: string[];
  weight: number;
  enabled: boolean;
}

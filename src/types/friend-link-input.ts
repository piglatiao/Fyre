// 友链新增/编辑入参
export interface FriendLinkInput {
  title: string;
  avatarUrl: string;
  description: string;
  siteUrl: string;
  tags: string[];
  weight: number;
  enabled: boolean;
}

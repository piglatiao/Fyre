// 前台友链视图：仅包含展示所需字段
export interface FriendLink {
  id: number;
  title: string;
  avatarUrl: string;
  description: string;
  siteUrl: string;
  tags: string[];
  weight: number;
}

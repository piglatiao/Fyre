// 后台书签条目：补充所属分组、启停状态与时间
export interface AdminBookmarkItem {
  id: number;
  groupId: number;
  title: string;
  url: string;
  description: string;
  icon: string;
  weight: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

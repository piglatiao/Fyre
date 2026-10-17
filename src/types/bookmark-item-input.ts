// 书签条目新增/编辑入参
export interface BookmarkItemInput {
  groupId: number;
  title: string;
  url: string;
  description: string;
  icon: string;
  weight: number;
  enabled: boolean;
}

// 书签分组新增/编辑入参
export interface BookmarkGroupInput {
  name: string;
  slug: string;
  icon: string;
  description: string;
  weight: number;
  enabled: boolean;
}

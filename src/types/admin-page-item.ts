// 后台页面列表项
export interface AdminPageItem {
  id: number;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: Date;
}

// 后台分类列表项
export interface AdminCategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort: number;
  postCount: number;
}

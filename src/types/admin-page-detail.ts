// 后台页面详情（编辑器回填用）
export interface AdminPageDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  updatedAt: Date;
}

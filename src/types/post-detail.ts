// 文章详情（正文渲染所需字段）
export interface PostDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  coverUrl: string | null;
  viewCount: number;
  encrypted: boolean;
  // 所属系列名称；用于文章页的系列导航
  series: string | null;
  publishedAt: Date;
  updatedAt: Date;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
}

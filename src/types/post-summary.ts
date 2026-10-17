// 文章列表项（卡片展示所需字段）
export interface PostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string | null;
  publishedAt: Date;
  viewCount: number;
  pinned: boolean;
  // 是否启用密码保护：列表卡片据此展示锁定提示
  encrypted: boolean;
  // 所属系列名称；null 表示未归入系列
  series: string | null;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
}

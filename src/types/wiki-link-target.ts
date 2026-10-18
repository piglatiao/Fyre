// Wiki Link 可解析的文章元数据：用于行内链接文字与独立链接卡片
export interface WikiLinkTarget {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  publishedAt: string;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
  encrypted: boolean;
}

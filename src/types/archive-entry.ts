// 归档条目
export interface ArchiveEntry {
  title: string;
  slug: string;
  publishedAt: Date;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
}

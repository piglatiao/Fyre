import type { PostStatus } from "@/generated/prisma/client";

// 后台文章详情（编辑器回填用）
export interface AdminPostDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverUrl: string | null;
  status: PostStatus;
  pinned: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  categoryId: number | null;
  tagIds: number[];
  // 所属系列名称（编辑器回填用）
  series: string | null;
  // 是否启用密码保护（编辑回填用，不回传密码哈希）
  encrypted: boolean;
}

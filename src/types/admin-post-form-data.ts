import type { PostStatus } from "@/generated/prisma/client";

// 后台文章表单数据（客户端视角：时间字段为 ISO 字符串）
export interface AdminPostFormData {
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
  publishedAt: string | null;
  scheduledAt: string | null;
  categoryId: number | null;
  tagIds: number[];
  // 所属系列名称
  series: string | null;
  encrypted: boolean;
}

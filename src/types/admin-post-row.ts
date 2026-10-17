import type { PostStatus } from "@/generated/prisma/client";

// 后台文章列表行（客户端视角：时间字段为 ISO 字符串）
export interface AdminPostRow {
  id: number;
  title: string;
  slug: string;
  status: PostStatus;
  pinned: boolean;
  encrypted: boolean;
  coverUrl: string | null;
  category: { id: number; name: string } | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string;
  viewCount: number;
}

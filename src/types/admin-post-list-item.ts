import type { PostStatus } from "@/generated/prisma/client";

// 后台文章列表项
export interface AdminPostListItem {
  id: number;
  title: string;
  slug: string;
  status: PostStatus;
  pinned: boolean;
  encrypted: boolean;
  coverUrl: string | null;
  category: { id: number; name: string } | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  updatedAt: Date;
  viewCount: number;
}

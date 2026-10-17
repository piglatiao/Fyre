import type { PostStatus } from "@/generated/prisma/client";

// 文章写入数据（服务层处理 slug、状态规则与密码哈希后传给仓储）
export interface PostWriteInput {
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
  // 所属系列名称；null 表示未归入系列
  series: string | null;
  // 是否启用密码保护
  encrypted: boolean;
  // 密码哈希：null 表示关闭加密
  passwordHash: string | null;
}

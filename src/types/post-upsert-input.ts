import type { PostStatus } from "@/generated/prisma/client";

// 文章新增/编辑入参（API 层 zod 校验后传入服务）
export interface PostUpsertInput {
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
  // 所属系列名称；留空表示不属于任何系列
  series: string | null;
  // 是否启用密码保护
  encrypted: boolean;
  // 访问密码明文：留空时表示不修改已有密码（新建时必须填写）
  password: string | null;
}

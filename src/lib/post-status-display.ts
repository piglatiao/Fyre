import type { PostStatus } from "@/generated/prisma/client";

// 文章状态中文名
export const postStatusLabels: Record<PostStatus, string> = {
  DRAFT: "草稿",
  SCHEDULED: "定时",
  PUBLISHED: "已发布",
  PRIVATE: "私密",
};

// 文章状态徽标配色
export const postStatusStyles: Record<PostStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  PRIVATE: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
};

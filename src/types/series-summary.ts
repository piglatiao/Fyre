import type { PostSummary } from "@/types/post-summary";

// 前台系列总览项：系列名称与按发布时间升序排列的文章
export interface SeriesSummary {
  name: string;
  posts: PostSummary[];
}

import type { SiteComment } from "./site-comment";

// 前台评论分页结果
export interface SiteCommentPage {
  items: SiteComment[];
  total: number;
  page: number;
  pageSize: number;
}

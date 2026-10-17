import type { AdminCommentItem } from "./admin-comment-item";
import type { CommentStatusCounts } from "./comment-status-counts";

// 后台评论分页与状态汇总
export interface AdminCommentPage {
  items: AdminCommentItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: CommentStatusCounts;
}

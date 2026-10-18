import type { AdminCommentView } from "./admin-comment-view";
import type { CommentStatusCounts } from "./comment-status-counts";

// 后台评论分页与状态汇总
export interface AdminCommentPage {
  items: AdminCommentView[];
  total: number;
  page: number;
  pageSize: number;
  counts: CommentStatusCounts;
}

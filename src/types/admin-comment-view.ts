import type { AdminCommentItem } from "./admin-comment-item";

// 后台评论展示数据：保留原始内容并附带已消毒的 Markdown HTML
export interface AdminCommentView extends AdminCommentItem {
  html: string;
}

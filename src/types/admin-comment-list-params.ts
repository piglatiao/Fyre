import type { CommentStatus, CommentTargetType } from "@/generated/prisma/client";

// 后台评论列表筛选条件
export interface AdminCommentListParams {
  page: number;
  pageSize: number;
  status?: CommentStatus;
  targetType?: CommentTargetType;
  keyword?: string;
}

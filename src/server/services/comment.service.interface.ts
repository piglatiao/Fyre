import type { CommentTargetType } from "@/generated/prisma/client";
import type { CommentSubmission } from "@/types/comment-submission";
import type { CommentSubmitResult } from "@/types/comment-submit-result";
import type { SiteCommentPage } from "@/types/site-comment-page";

// 前台评论服务接口
export interface CommentService {
  // 读取指定目标下已公开的评论
  listApproved(
    targetType: CommentTargetType,
    targetId: number | null,
    page: number,
    pageSize: number,
  ): Promise<SiteCommentPage>;
  // 校验并创建评论，按站点设置决定是否需要审核
  create(input: CommentSubmission): Promise<CommentSubmitResult>;
}

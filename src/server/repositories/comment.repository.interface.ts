import type { CommentTargetType } from "@/generated/prisma/client";
import type { CommentCreateData } from "@/types/comment-create-data";
import type { CommentSubmitResult } from "@/types/comment-submit-result";
import type { CommentTarget } from "@/types/comment-target";
import type { SiteComment } from "@/types/site-comment";

// 前台评论仓储接口：公开读取与访客提交
export interface CommentRepository {
  // 查询目标内容，仅已发布或已启用的记录可评论
  findPublishedTarget(targetType: CommentTargetType, targetId: number | null): Promise<CommentTarget | null>;
  // 分页读取已通过审核的评论
  findApprovedPage(
    targetType: CommentTargetType,
    targetId: number | null,
    page: number,
    pageSize: number,
  ): Promise<{ items: Array<Omit<SiteComment, "html">>; total: number }>;
  // 写入评论并返回审核状态
  create(input: CommentCreateData): Promise<CommentSubmitResult>;
}

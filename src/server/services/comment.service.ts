import { CommentStatus } from "@/generated/prisma/client";
import type { CommentTargetType } from "@/generated/prisma/client";
import type { CommentRepository } from "@/server/repositories/comment.repository.interface";
import type { CommentSubmission } from "@/types/comment-submission";
import type { CommentSubmitResult } from "@/types/comment-submit-result";
import type { SiteCommentPage } from "@/types/site-comment-page";
import { ServiceError } from "./service-error";
import type { CommentService } from "./comment.service.interface";
import type { SettingService } from "./setting.service.interface";

// 前台评论服务默认实现：统一校验开关、目标和审核策略
export class DefaultCommentService implements CommentService {
  constructor(
    private readonly comments: CommentRepository,
    private readonly settings: SettingService,
  ) {}

  async listApproved(
    targetType: CommentTargetType,
    targetId: number | null,
    page: number,
    pageSize: number,
  ): Promise<SiteCommentPage> {
    const settings = await this.settings.getSiteSettings();
    if (!settings.commentsEnabled) {
      throw new ServiceError("comments_disabled", "评论功能已关闭");
    }
    const target = await this.comments.findPublishedTarget(targetType, targetId);
    if (!target) {
      throw new ServiceError("comment_target_not_found", "评论目标不存在或尚未发布");
    }
    const result = await this.comments.findApprovedPage(targetType, targetId, page, pageSize);
    return { ...result, page, pageSize };
  }

  async create(input: CommentSubmission): Promise<CommentSubmitResult> {
    const settings = await this.settings.getSiteSettings();
    if (!settings.commentsEnabled) {
      throw new ServiceError("comments_disabled", "评论功能已关闭");
    }
    const target = await this.comments.findPublishedTarget(input.targetType, input.targetId);
    if (!target) {
      throw new ServiceError("comment_target_not_found", "评论目标不存在或尚未发布");
    }
    return this.comments.create({
      ...input,
      targetTitle: target.title,
      status: settings.commentsRequireApproval ? CommentStatus.PENDING : CommentStatus.APPROVED,
    });
  }
}

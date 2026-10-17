import type { CommentStatus } from "@/generated/prisma/client";
import type { AdminCommentRepository } from "@/server/repositories/admin-comment.repository.interface";
import type { AdminCommentListParams } from "@/types/admin-comment-list-params";
import type { AdminCommentPage } from "@/types/admin-comment-page";
import { ServiceError } from "./service-error";
import type { AdminCommentService } from "./admin-comment.service.interface";

// 后台评论服务默认实现：校验分页参数与记录存在性
export class DefaultAdminCommentService implements AdminCommentService {
  constructor(private readonly comments: AdminCommentRepository) {}

  async list(params: AdminCommentListParams): Promise<AdminCommentPage> {
    const page = Number.isFinite(params.page) ? Math.max(1, Math.round(params.page)) : 1;
    const pageSize = Number.isFinite(params.pageSize)
      ? Math.min(100, Math.max(1, Math.round(params.pageSize)))
      : 20;
    return this.comments.findPage({ ...params, page, pageSize, keyword: params.keyword?.trim() || undefined });
  }

  async updateStatus(id: number, status: CommentStatus): Promise<void> {
    const existing = await this.comments.findById(id);
    if (!existing) {
      throw new ServiceError("comment_not_found", "评论不存在或已被删除");
    }
    await this.comments.updateStatus(id, status);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.comments.findById(id);
    if (!existing) {
      throw new ServiceError("comment_not_found", "评论不存在或已被删除");
    }
    await this.comments.remove(id);
  }
}

import type { CommentStatus } from "@/generated/prisma/client";
import type { AdminCommentListParams } from "@/types/admin-comment-list-params";
import type { AdminCommentPage } from "@/types/admin-comment-page";

// 后台评论服务接口
export interface AdminCommentService {
  // 分页筛选评论
  list(params: AdminCommentListParams): Promise<AdminCommentPage>;
  // 修改审核状态
  updateStatus(id: number, status: CommentStatus): Promise<void>;
  // 删除评论
  remove(id: number): Promise<void>;
}

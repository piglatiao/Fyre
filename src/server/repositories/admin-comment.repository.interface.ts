import type { CommentStatus } from "@/generated/prisma/client";
import type { AdminCommentItem } from "@/types/admin-comment-item";
import type { AdminCommentListParams } from "@/types/admin-comment-list-params";
import type { CommentStatusCounts } from "@/types/comment-status-counts";

// 后台评论仓储接口
export interface AdminCommentRepository {
  // 分页筛选评论并返回全量状态汇总
  findPage(params: AdminCommentListParams): Promise<{
    items: AdminCommentItem[];
    total: number;
    page: number;
    pageSize: number;
    counts: CommentStatusCounts;
  }>;
  // 按编号读取评论
  findById(id: number): Promise<AdminCommentItem | null>;
  // 更新审核状态
  updateStatus(id: number, status: CommentStatus): Promise<void>;
  // 删除评论
  remove(id: number): Promise<void>;
  // 低开销统计：供仪表盘待审核提醒使用
  countStatus(): Promise<CommentStatusCounts>;
}

import type { CommentStatus, CommentTargetType } from "@/generated/prisma/client";

// 后台评论记录：包含审核所需的邮箱与完整时间
export interface AdminCommentItem {
  id: number;
  targetType: CommentTargetType;
  targetId: number | null;
  targetTitle: string;
  authorName: string;
  authorEmail: string;
  authorWebsite: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
}

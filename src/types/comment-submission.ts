import type { CommentTargetType } from "@/generated/prisma/client";

// 前台评论提交内容：邮箱与网站允许为空
export interface CommentSubmission {
  targetType: CommentTargetType;
  targetId: number | null;
  authorName: string;
  authorEmail: string;
  authorWebsite: string;
  content: string;
}

import type { CommentStatus } from "@/generated/prisma/client";

// 评论提交结果：前台据此判断是否需要提示等待审核
export interface CommentSubmitResult {
  id: number;
  status: CommentStatus;
}

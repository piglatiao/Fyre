import type { CommentStatus } from "@/generated/prisma/client";
import type { CommentSubmission } from "./comment-submission";

// 评论入库数据：在提交内容基础上补充服务端快照与审核状态
export interface CommentCreateData extends CommentSubmission {
  targetTitle: string;
  status: CommentStatus;
}

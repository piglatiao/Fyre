import type { CommentTargetType } from "@/generated/prisma/client";

// 评论目标：由服务端解析出的已发布内容标题与归属编号
export interface CommentTarget {
  type: CommentTargetType;
  id: number | null;
  title: string;
}

import type { CommentStatus, CommentTargetType } from "@/generated/prisma/client";

// 评论内容类型中文名称
export const COMMENT_TARGET_LABELS: Record<CommentTargetType, string> = {
  POST: "文章",
  GALLERY_ALBUM: "相册",
  PROJECT: "项目",
  PAGE: "页面",
  DYNAMIC: "动态",
  GUESTBOOK: "留言",
  SPONSOR: "打赏",
  FRIENDS: "友链",
};

// 评论审核状态中文名称
export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  HIDDEN: "已隐藏",
};

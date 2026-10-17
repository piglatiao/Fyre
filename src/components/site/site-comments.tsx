import { cache } from "react";
import type { CommentTargetType } from "@/generated/prisma/client";
import { createSiteServices } from "@/server/services/service-container";
import CommentSection from "./comment-section";

// 同一请求内复用评论开关，避免动态列表每个条目重复读取设置
const loadCommentSettings = cache(async () => {
  const { settingService } = createSiteServices();
  const settings = await settingService.getSiteSettings();
  return {
    enabled: settings.commentsEnabled,
    requireApproval: settings.commentsRequireApproval,
  };
});

// 全站评论挂载位：服务端读取站点设置，客户端负责提交与分页展示
export default async function SiteComments({
  targetType,
  targetId = null,
  title,
  collapsible = false,
}: {
  targetType: CommentTargetType;
  targetId?: number | null;
  title: string;
  collapsible?: boolean;
}) {
  const settings = await loadCommentSettings();
  if (!settings.enabled) {
    return null;
  }
  return (
    <CommentSection
      targetType={targetType}
      targetId={targetId}
      title={title}
      requireApproval={settings.requireApproval}
      collapsible={collapsible}
    />
  );
}

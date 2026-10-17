import { z } from "zod";

// 友链新增/编辑入参校验
export const friendLinkUpsertSchema = z.object({
  title: z.string().trim().min(1, "请填写友链名称").max(100, "友链名称不能超过 100 字"),
  avatarUrl: z.string().trim().max(500, "头像地址过长").default(""),
  description: z.string().trim().max(300, "描述不能超过 300 字").default(""),
  siteUrl: z.url("友链地址格式不正确").max(500, "友链地址过长"),
  tags: z.array(z.string().trim().min(1).max(30, "标签不能超过 30 字")).max(8, "最多设置 8 个标签").default([]),
  weight: z.coerce.number().int().min(-9999).max(9999).default(0),
  enabled: z.coerce.boolean().default(true),
});
